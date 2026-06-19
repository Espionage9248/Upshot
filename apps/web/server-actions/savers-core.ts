/**
 * Pure saver-goal persistence (db-injected). Local-only — saver goals are NOT
 * synced to Up. There is no UpClient here.
 *
 * Kept out of the "use server" module so these helpers are NOT registered as
 * client-callable Server Actions. The thin auth-guarded wrapper lives in
 * `savers.ts` (same split as assets-core.ts / assets.ts).
 */

import { randomUUID } from "node:crypto";
import { DrizzleAccountRepo, tables, type DbClient } from "@upshot/db";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Append an event_log entry. createdAt defaults in-schema. */
function logEvent(
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
      category: "account",
      action,
      entityType,
      entityId,
      description,
      meta,
    })
    .run();
}

// ---------------------------------------------------------------------------
// setSaverGoal
// ---------------------------------------------------------------------------

/** Set or clear the goal on a saver account. Clearing = both null. */
export async function setSaverGoal(
  db: DbClient,
  accountId: string,
  goalTargetCents: number | null,
  goalTargetDate: string | null,
): Promise<void> {
  await new DrizzleAccountRepo(db).setGoal(accountId, goalTargetCents, goalTargetDate);
  logEvent(
    db,
    "set_saver_goal",
    "account",
    accountId,
    goalTargetCents !== null
      ? `Set saver goal: ${goalTargetCents} cents by ${goalTargetDate}`
      : `Cleared saver goal`,
    { goalTargetCents, goalTargetDate },
  );
}
