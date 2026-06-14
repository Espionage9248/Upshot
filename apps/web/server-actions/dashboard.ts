"use server";

/**
 * Dashboard bento layout Server Actions.
 *
 * Security invariants (single-user app — non-negotiable):
 *   - Every action re-checks the session server-side (requireSession), so an
 *     unauthenticated call redirects to /login before any DB access.
 *   - No secret is ever passed to console.* / logged.
 *
 * The actual persistence is the pure, db-injected `saveLayout`/`loadLayout` in
 * `dashboard-core.ts`. These wrappers are intentionally thin so Task 24's
 * `action()` result-contract wrapper can wrap them cleanly.
 */

import { requireSession } from "@/lib/auth-guard";
import { getDb } from "@/lib/db";
import { saveLayout, loadLayout, type DashboardWidget } from "./dashboard-core";

// Type-only re-export (erased at runtime, so it stays valid in a "use server"
// module) — lets the bento components keep a single import site for the shape.
export type { DashboardWidget } from "./dashboard-core";

/** Action: persist the current layout. Re-checks auth, then delegates. */
export async function saveLayoutAction(widgets: DashboardWidget[]): Promise<void> {
  await requireSession();
  const { db } = getDb();
  return saveLayout(db, widgets);
}

/** Action: load the persisted layout. Re-checks auth, then delegates. */
export async function loadLayoutAction(): Promise<DashboardWidget[]> {
  await requireSession();
  const { db } = getDb();
  return loadLayout(db);
}
