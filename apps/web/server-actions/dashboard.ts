"use server";

/**
 * Dashboard bento layout Server Actions.
 *
 * Security invariants (single-user app — non-negotiable):
 *   - Every action re-checks the session server-side via action(), which
 *     short-circuits an unauthenticated call before any DB access and returns a
 *     safe ActionResult (no redirect — these are fetch-invoked actions).
 *   - No secret is ever passed to console.* / logged.
 *
 * The actual persistence is the pure, db-injected `saveLayout`/`loadLayout` in
 * `dashboard-core.ts`. These wrappers are intentionally thin so the `action()`
 * result-contract wrapper wraps them cleanly.
 */

import { action } from "@/lib/action";
import { getDb } from "@/lib/db";
import { saveLayout, loadLayout, type DashboardWidget } from "./dashboard-core";

// Type-only re-export (erased at runtime, so it stays valid in a "use server"
// module) — lets the bento components keep a single import site for the shape.
export type { DashboardWidget } from "./dashboard-core";

/** Action: persist the current layout. Re-checks auth, then delegates. */
export const saveLayoutAction = action(
  async (_session, widgets: DashboardWidget[]) => {
    const { db } = getDb();
    return saveLayout(db, widgets);
  },
);

/** Action: load the persisted layout. Re-checks auth, then delegates. */
export const loadLayoutAction = action(async () => {
  const { db } = getDb();
  return loadLayout(db);
});
