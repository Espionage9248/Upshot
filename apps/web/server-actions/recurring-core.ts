/**
 * Pure recurring persistence (db-injected). Local-only.
 *
 * Kept out of the "use server" module so these helpers are NOT registered as
 * client-callable Server Actions. The thin auth-guarded wrappers live in
 * `recurring.ts` (same split as debts-core.ts / debts.ts).
 */

import { randomUUID } from "node:crypto";
import { DrizzleRecurringRepo, tables, type DbClient } from "@upshot/db";

// Re-export RecurringRow type (avoids @upshot/contracts import in callers).
export type RecurringRow = Awaited<ReturnType<DrizzleRecurringRepo["list"]>>[number];

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Append an event_log entry. */
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
      category: "recurring",
      action,
      entityType: "recurring_item",
      entityId,
      description,
      meta,
    })
    .run();
}

// ---------------------------------------------------------------------------
// acceptSuggestion
// ---------------------------------------------------------------------------

/**
 * Accept a suggested recurring item: sets status to ACTIVE and writes an event_log row.
 */
export async function acceptSuggestion(db: DbClient, id: string): Promise<void> {
  const repo = new DrizzleRecurringRepo(db);
  await repo.setStatus(id, "ACTIVE");
  logEvent(db, "accept_suggestion", id, `Accepted recurring suggestion ${id}`, { id });
}

// ---------------------------------------------------------------------------
// dismissSuggestion
// ---------------------------------------------------------------------------

/**
 * Dismiss a suggested recurring item: sets status to CANCELLED (NOT delete).
 * This keeps the pattern in knownPatterns() so the sync engine won't re-suggest it.
 */
export async function dismissSuggestion(db: DbClient, id: string): Promise<void> {
  const repo = new DrizzleRecurringRepo(db);
  await repo.setStatus(id, "CANCELLED");
  logEvent(db, "dismiss_suggestion", id, `Dismissed recurring suggestion ${id}`, { id });
}

// ---------------------------------------------------------------------------
// pauseRecurring
// ---------------------------------------------------------------------------

/**
 * Pause an active recurring item: sets status to PAUSED and writes an event_log row.
 */
export async function pauseRecurring(db: DbClient, id: string): Promise<void> {
  const repo = new DrizzleRecurringRepo(db);
  await repo.setStatus(id, "PAUSED");
  logEvent(db, "pause_recurring", id, `Paused recurring item ${id}`, { id });
}

// ---------------------------------------------------------------------------
// removeRecurring
// ---------------------------------------------------------------------------

/**
 * Permanently delete a recurring item and write an event_log row.
 */
export async function removeRecurring(db: DbClient, id: string): Promise<void> {
  const repo = new DrizzleRecurringRepo(db);
  await repo.delete(id);
  logEvent(db, "delete_recurring", id, `Deleted recurring item ${id}`, { id });
}

// ---------------------------------------------------------------------------
// setRecurringKind
// ---------------------------------------------------------------------------

/**
 * Override a recurring item's bill-vs-subscription classification and write an
 * event_log row. `kind` is "BILL" | "SUBSCRIPTION".
 */
export async function setRecurringKind(
  db: DbClient,
  id: string,
  kind: RecurringRow["kind"],
): Promise<void> {
  const repo = new DrizzleRecurringRepo(db);
  await repo.setKind(id, kind);
  logEvent(db, "set_kind", id, `Set kind to ${kind} for recurring item ${id}`, { kind });
}
