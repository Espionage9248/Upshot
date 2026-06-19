"use server";

/**
 * Saver Server Actions (auth-guarded wrappers). Local-only — saver goals are
 * NOT synced to Up. No UpClient is constructed here.
 *
 * Security invariants (single-user app — non-negotiable):
 *   - Every action re-checks the session server-side via action(), which
 *     short-circuits an unauthenticated call before any DB access and returns a
 *     safe ActionResult.
 *
 * The actual persistence + event_log logic is in `savers-core.ts` (pure,
 * db-injected). These wrappers stay thin so the action() result-contract
 * wraps them cleanly (a "use server" module may export only async functions +
 * `export type` re-exports).
 */

import { action } from "@/lib/action";
import { getDb } from "@/lib/db";
import { setSaverGoal } from "./savers-core";

/** Action: set or clear the goal on a saver account. */
export const setSaverGoalAction = action(
  async (_session, accountId: string, goalTargetCents: number | null, goalTargetDate: string | null) => {
    const { db } = getDb();
    await setSaverGoal(db, accountId, goalTargetCents, goalTargetDate);
  },
);
