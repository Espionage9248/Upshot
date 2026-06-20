/**
 * Pure transaction edit persistence (db-injected + optional Up write-back).
 *
 * For setCategory and setTags, local writes happen FIRST (DB always wins),
 * then an Up push is attempted if an UpClientPort is provided. A push failure
 * is caught, written to event_log with a SAFE reason (no secrets, no stack),
 * and surfaced via a `warning` on the returned data. The local edit is NEVER
 * rolled back. Missing token (up=null) is logged as "skipped" — no warning.
 *
 * markSalary, markTransfer, markTaxDeductible are local-only (no Up concept).
 *
 * Kept out of the "use server" module so these helpers are NOT registered as
 * client-callable Server Actions. The thin auth-guarded wrappers live in
 * `money.ts` (same split as budget-core.ts / budget.ts).
 */

import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { tables, type DbClient } from "@upshot/db";
import type { UpClientPort } from "@upshot/core";
import { UpAuthError, UpHttpError } from "@upshot/core";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A non-fatal warning carried inside ActionResult.data when a push-back fails. */
export interface ServerActionWarning {
  code: string;
  message: string;
}

export type SetCategoryResult = { warning?: ServerActionWarning };
export type SetTagsResult = { warning?: ServerActionWarning };

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Append an event_log entry. createdAt defaults in-schema. */
export function logEvent(
  db: DbClient,
  action: string,
  entityType: string,
  entityId: string,
  description: string,
  meta: Record<string, unknown>,
): void {
  db.insert(tables.eventLog)
    .values({
      id: randomUUID(),
      category: "transaction",
      action,
      entityType,
      entityId,
      description,
      meta,
    })
    .run();
}

/**
 * Derive a SAFE reason string from a caught error. MUST NOT include
 * err.message, err.stack, the token, or any URL.
 */
function safeReason(err: unknown): string {
  if (err instanceof UpAuthError) return `UpAuthError_${err.status}`;
  if (err instanceof UpHttpError) return `UpHttpError_${err.status}`;
  return "push_failed";
}

// ---------------------------------------------------------------------------
// setCategory
// ---------------------------------------------------------------------------

/**
 * Update a transaction's categoryId, then attempt an Up write-back.
 * The local write is never rolled back. See module doc for the full contract.
 */
export async function setCategory(
  db: DbClient,
  up: UpClientPort | null,
  txId: string,
  categoryId: string | null,
): Promise<SetCategoryResult> {
  // 1. Persist locally first (DB always wins).
  db.update(tables.transactions)
    .set({ categoryId })
    .where(eq(tables.transactions.id, txId))
    .run();

  // 2. Attempt Up push or skip.
  if (up === null) {
    logEvent(db, "up_writeback_skipped", "transaction", txId, "setCategory skipped: no token", {
      reason: "no_token",
    });
    return {};
  }

  try {
    await up.setCategory(txId, categoryId);
    return {};
  } catch (err) {
    const reason = safeReason(err);
    logEvent(db, "up_writeback_failed", "transaction", txId, "setCategory push failed", {
      reason,
    });
    return {
      warning: {
        code: "up_writeback_failed",
        message: "Category saved locally but could not be pushed to Up.",
      },
    };
  }
}

// ---------------------------------------------------------------------------
// setTags
// ---------------------------------------------------------------------------

/**
 * Apply tag additions and removals locally, then push each ADDED tag to Up.
 * Removals are local-only (Up has no removeTag API). The local write is never
 * rolled back. A push failure for any tag returns a warning.
 */
export async function setTags(
  db: DbClient,
  up: UpClientPort | null,
  txId: string,
  addTagIds: string[],
  removeTagIds: string[],
): Promise<SetTagsResult> {
  // 1. Apply local removals (surgical: only the specified tag IDs).
  if (removeTagIds.length > 0) {
    db.delete(tables.transactionTags)
      .where(
        and(
          eq(tables.transactionTags.transactionId, txId),
          inArray(tables.transactionTags.tagId, removeTagIds),
        ),
      )
      .run();
  }

  // 2. Insert added tags — tolerate an already-present pair.
  for (const tagId of addTagIds) {
    db.insert(tables.transactionTags)
      .values({ transactionId: txId, tagId })
      .onConflictDoNothing()
      .run();
  }

  logEvent(db, "set_tags", "transaction", txId, "Tags updated", {
    added: addTagIds,
    removed: removeTagIds,
  });

  // 3. Push added tags to Up (removals are local-only — Up has no removeTag).
  if (up === null) {
    logEvent(db, "up_writeback_skipped", "transaction", txId, "setTags skipped: no token", {
      reason: "no_token",
    });
    return {};
  }

  for (const tagId of addTagIds) {
    try {
      await up.addTag(txId, tagId);
    } catch (err) {
      const reason = safeReason(err);
      logEvent(db, "up_writeback_failed", "transaction", txId, "addTag push failed", {
        reason,
        tagId,
      });
      return {
        warning: {
          code: "up_writeback_failed",
          message: "Tags saved locally but one or more could not be pushed to Up.",
        },
      };
    }
  }

  return {};
}

// ---------------------------------------------------------------------------
// markSalary
// ---------------------------------------------------------------------------

/** Mark / unmark a transaction as salary income. Local-only. */
export async function markSalary(
  db: DbClient,
  txId: string,
  value: boolean,
): Promise<void> {
  db.update(tables.transactions)
    .set({ isSalary: value })
    .where(eq(tables.transactions.id, txId))
    .run();

  logEvent(db, "mark_salary", "transaction", txId, `Marked salary: ${value}`, { value });
}

// ---------------------------------------------------------------------------
// markTransfer
// ---------------------------------------------------------------------------

/** Mark / unmark a transaction as a transfer. Local-only. */
export async function markTransfer(
  db: DbClient,
  txId: string,
  value: boolean,
  transferAccountId?: string,
): Promise<void> {
  db.update(tables.transactions)
    .set({ isTransfer: value, transferAccountId: value ? (transferAccountId ?? null) : null })
    .where(eq(tables.transactions.id, txId))
    .run();

  logEvent(db, "mark_transfer", "transaction", txId, `Marked transfer: ${value}`, {
    value,
    transferAccountId: transferAccountId ?? null,
  });
}

// ---------------------------------------------------------------------------
// markTaxDeductible
// ---------------------------------------------------------------------------

/** Mark / unmark a transaction as tax-deductible. Local-only. */
export async function markTaxDeductible(
  db: DbClient,
  txId: string,
  value: boolean,
  deductionCategory?: string,
): Promise<void> {
  db.update(tables.transactions)
    .set({
      isTaxDeductible: value,
      taxDeductionCategory: value ? (deductionCategory ?? null) : null,
    })
    .where(eq(tables.transactions.id, txId))
    .run();

  logEvent(db, "mark_tax_deductible", "transaction", txId, `Marked tax deductible: ${value}`, {
    value,
    deductionCategory: deductionCategory ?? null,
  });
}
