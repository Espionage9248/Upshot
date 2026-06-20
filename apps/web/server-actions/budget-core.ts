/**
 * Pure budget allocation persistence (db-injected, no auth/Next concerns).
 *
 * Local bookkeeping only — Up cannot move money, so setAllocation/transfer
 * never call Up. They write the `budget_allocations` row(s), mirror the target
 * onto `accounts.monthlyAllocationCents`, and append an `event_log` entry.
 *
 * Kept out of the "use server" module so these helpers are NOT registered as
 * client-callable Server Actions (they take a non-serializable DbClient). The
 * thin auth-guarded wrappers live in `budget.ts` — the same split as
 * dashboard-core.ts / redeem-core.ts.
 */

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import {
  DrizzleBudgetAllocationRepo,
  tables,
  type DbClient,
} from "@upshot/db";
import type { NewBudgetAllocation } from "@upshot/core";

/** Typed domain results — no thrown secrets reach the action wrapper. */
export type SetAllocationResult = { ok: true };
export type TransferResult = { ok: true } | { ok: false; code: "overdraw" };

/** The existing (accountId, month) allocation row, or undefined when none. */
function existingRow(db: DbClient, accountId: string, month: string) {
  return db
    .select()
    .from(tables.budgetAllocations)
    .where(
      and(eq(tables.budgetAllocations.accountId, accountId), eq(tables.budgetAllocations.month, month)),
    )
    .get();
}

/**
 * Build a repo upsert payload. `year` is derived from the YYYY-MM month (the
 * repo derives it too, but the port type requires it); `notes` carries through
 * the existing row's value so a re-allocate never silently clears it.
 */
function upsertPayload(
  accountId: string,
  month: string,
  allocatedCents: number,
  spentCents: number,
  notes: string | null,
): NewBudgetAllocation {
  return {
    id: randomUUID(),
    accountId,
    month,
    year: Number(month.slice(0, 4)),
    allocatedCents,
    spentCents,
    notes,
  };
}

/** Append an event_log entry. id is caller-supplied; createdAt defaults in-schema. */
function logEvent(
  db: DbClient,
  action: string,
  entityId: string,
  description: string,
  meta: Record<string, unknown>,
): void {
  db.insert(tables.eventLog)
    .values({
      id: randomUUID(),
      category: "budget",
      action,
      entityType: "account",
      entityId,
      description,
      meta,
    })
    .run();
}

/**
 * Upsert the (accountId, month) allocation to `allocatedCents` and mirror the
 * same target onto `accounts.monthlyAllocationCents`. Variance is recomputed by
 * the repo (allocatedCents − spentCents, spentCents preserved). Writes an event.
 */
export async function setAllocation(
  db: DbClient,
  accountId: string,
  month: string,
  allocatedCents: number,
): Promise<SetAllocationResult> {
  // Preserve any accrued spend + notes: the repo overwrites both to the passed
  // values, so re-read them rather than zeroing/clearing on re-allocate.
  const prev = existingRow(db, accountId, month);

  const repo = new DrizzleBudgetAllocationRepo(db);
  await repo.upsert(
    upsertPayload(accountId, month, allocatedCents, prev?.spentCents ?? 0, prev?.notes ?? null),
  );

  db.update(tables.accounts)
    .set({ monthlyAllocationCents: allocatedCents })
    .where(eq(tables.accounts.id, accountId))
    .run();

  logEvent(db, "allocate", accountId, `Set allocation for ${month}`, {
    month,
    allocatedCents,
  });
  return { ok: true };
}

/**
 * Move `cents` of allocation from one account to another for `month`. Both
 * resulting allocations must stay ≥ 0 — REJECTS with `overdraw` if `from` would
 * go negative, leaving both rows untouched. A missing allocation reads as 0.
 * Writes a single `transfer` event on success only.
 */
export async function transferAllocation(
  db: DbClient,
  fromAccountId: string,
  toAccountId: string,
  month: string,
  cents: number,
): Promise<TransferResult> {
  const fromRow = existingRow(db, fromAccountId, month);
  const toRow = existingRow(db, toAccountId, month);

  const fromNext = (fromRow?.allocatedCents ?? 0) - cents;
  if (fromNext < 0) return { ok: false, code: "overdraw" };
  const toNext = (toRow?.allocatedCents ?? 0) + cents;

  // Preserve accrued spend + notes on both rows (see setAllocation for why).
  const repo = new DrizzleBudgetAllocationRepo(db);
  await repo.upsert(
    upsertPayload(fromAccountId, month, fromNext, fromRow?.spentCents ?? 0, fromRow?.notes ?? null),
  );
  await repo.upsert(
    upsertPayload(toAccountId, month, toNext, toRow?.spentCents ?? 0, toRow?.notes ?? null),
  );

  db.update(tables.accounts)
    .set({ monthlyAllocationCents: fromNext })
    .where(eq(tables.accounts.id, fromAccountId))
    .run();
  db.update(tables.accounts)
    .set({ monthlyAllocationCents: toNext })
    .where(eq(tables.accounts.id, toAccountId))
    .run();

  logEvent(db, "transfer", fromAccountId, `Transferred allocation for ${month}`, {
    month,
    cents,
    fromAccountId,
    toAccountId,
  });
  return { ok: true };
}
