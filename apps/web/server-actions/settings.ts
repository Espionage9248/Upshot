"use server";

/**
 * Settings Server Actions (Connections & sync).
 *
 * Security invariants (single-user app — non-negotiable):
 *   - Every action re-checks the session server-side via action(), which
 *     short-circuits an unauthenticated call before any DB access and returns a
 *     safe ActionResult.
 *   - No secret is ever passed to console.* / logged.
 *
 * The actual persistence + validation is the pure, db-injected core in
 * `settings-core.ts`. These wrappers are intentionally thin so the action()
 * result-contract wraps them cleanly (a "use server" module may export only
 * async functions + `export type` re-exports).
 */

import { action } from "@/lib/action";
import { getDb } from "@/lib/db";
import {
  setCadence,
  setAutomationFlag,
  type SyncCadence,
  type AutomationFlag,
} from "./settings-core";

export type { SyncCadence, AutomationFlag, AppSettings } from "./settings-core";

/** Action: persist the sync cadence. Re-checks auth, then delegates. */
export const setCadenceAction = action(async (_session, cadence: SyncCadence) => {
  const { db } = getDb();
  return setCadence(db, cadence);
});

/** Action: persist a single automation flag. Re-checks auth, then delegates. */
export const setAutomationFlagAction = action(
  async (_session, key: AutomationFlag, on: boolean) => {
    const { db } = getDb();
    return setAutomationFlag(db, key, on);
  },
);
