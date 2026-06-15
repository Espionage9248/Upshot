/**
 * Pure dashboard-bento persistence (db-injected, no auth/Next concerns).
 *
 * Kept out of the "use server" module so these helpers are NOT registered as
 * client-callable Server Actions (they take a non-serializable DbClient). The
 * thin auth-guarded action wrappers live in `dashboard.ts` and delegate here —
 * the same split as redeem-core.ts / recovery.ts.
 */

import { asc } from "drizzle-orm";
import { tables, type DbClient } from "@upshot/db";

/**
 * Matches the `dashboard_widgets` row shape. Defined locally rather than imported
 * from @upshot/contracts (not a dep of apps/web).
 */
export type DashboardWidget = {
  id: string;
  widgetKey: string;
  position: number;
  size: string;
  visible: boolean;
  config: Record<string, unknown> | null;
};

/**
 * Replace the persisted layout with `widgets`. Delete-then-insert (a single
 * full snapshot) so order/size/visibility round-trip exactly and no stale or
 * duplicate rows survive a re-save. db-injected + pure for testability.
 */
export async function saveLayout(db: DbClient, widgets: DashboardWidget[]): Promise<void> {
  db.delete(tables.dashboardWidgets).run();
  if (widgets.length === 0) return;
  db.insert(tables.dashboardWidgets)
    .values(
      widgets.map((w) => ({
        id: w.id,
        widgetKey: w.widgetKey,
        position: w.position,
        size: w.size,
        visible: w.visible,
        config: w.config,
      })),
    )
    .run();
}

/**
 * Load the persisted layout ordered by position. Returns [] on an empty DB so
 * the caller falls back to the registry defaults. db-injected + pure.
 */
export async function loadLayout(db: DbClient): Promise<DashboardWidget[]> {
  const rows = db
    .select()
    .from(tables.dashboardWidgets)
    .orderBy(asc(tables.dashboardWidgets.position))
    .all();
  return rows.map((r) => ({
    id: r.id,
    widgetKey: r.widgetKey,
    position: r.position,
    size: r.size,
    visible: r.visible,
    config: r.config ?? null,
  }));
}
