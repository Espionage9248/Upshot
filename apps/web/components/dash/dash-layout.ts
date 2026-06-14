import type { UIconKey } from "@upshot/ui";
import type { DashboardWidget } from "@/server-actions/dashboard";

/** Persisted size token → grid column span (grid is repeat(4, 1fr)). */
export const SIZE_SPAN: Record<string, number> = { sm: 1, md: 2, lg: 2 };

export type WidgetDef = {
  widgetKey: string;
  title: string;
  defaultSize: "sm" | "md" | "lg";
  icon: UIconKey;
};

/**
 * The widget registry: every addable widget + the default layout order. Kept as
 * a flat const (no per-instance config) — the bento here is an arrange + persist
 * mechanism over shells, not a data-wiring surface.
 */
export const WIDGET_REGISTRY: readonly WidgetDef[] = [
  { widgetKey: "safe-to-spend", title: "Safe to spend", defaultSize: "lg", icon: "wallet" },
  { widgetKey: "net-worth", title: "Net worth", defaultSize: "sm", icon: "scale" },
  { widgetKey: "readiness", title: "Readiness", defaultSize: "sm", icon: "shield" },
  { widgetKey: "forecast", title: "Cashflow forecast", defaultSize: "md", icon: "trend" },
  { widgetKey: "streak", title: "Streak", defaultSize: "sm", icon: "flame" },
  { widgetKey: "upcoming", title: "Upcoming", defaultSize: "sm", icon: "clock" },
  { widgetKey: "insights", title: "For you", defaultSize: "md", icon: "flag" },
  { widgetKey: "category", title: "Category breakdown", defaultSize: "md", icon: "percent" },
  { widgetKey: "card-util", title: "Card utilisation", defaultSize: "sm", icon: "card" },
  { widgetKey: "wishlist", title: "Wishlist progress", defaultSize: "sm", icon: "tag" },
];

export function defByKey(widgetKey: string): WidgetDef | undefined {
  return WIDGET_REGISTRY.find((d) => d.widgetKey === widgetKey);
}

/** The opinionated default layout (first 7 widgets, in registry order). */
export function defaultLayout(): DashboardWidget[] {
  return WIDGET_REGISTRY.slice(0, 7).map((d, i) => ({
    id: `w-${d.widgetKey}`,
    widgetKey: d.widgetKey,
    position: i,
    size: d.defaultSize,
    visible: true,
    config: null,
  }));
}

/** Re-number positions 0..n to match array order. Pure. */
function renumber(widgets: DashboardWidget[]): DashboardWidget[] {
  return widgets.map((w, i) => ({ ...w, position: i }));
}

/**
 * Move the widget at `from` to `to`, re-numbering positions. Pure; out-of-range
 * indices are clamped to a no-op-safe move. This is the native-drag reorder.
 */
export function reorder(
  widgets: DashboardWidget[],
  from: number,
  to: number,
): DashboardWidget[] {
  if (from === to || from < 0 || from >= widgets.length) return widgets;
  const next = widgets.slice();
  const [moved] = next.splice(from, 1);
  if (!moved) return widgets;
  const clamped = Math.max(0, Math.min(to, next.length));
  next.splice(clamped, 0, moved);
  return renumber(next);
}

/** Hide a widget (visible:false). Position is preserved. Pure. */
export function hideWidget(widgets: DashboardWidget[], id: string): DashboardWidget[] {
  return widgets.map((w) => (w.id === id ? { ...w, visible: false } : w));
}

/**
 * Add a widget from the registry. If it already exists hidden, re-show it;
 * otherwise append a fresh instance at the end. Pure.
 */
export function addWidget(widgets: DashboardWidget[], widgetKey: string): DashboardWidget[] {
  const existing = widgets.find((w) => w.widgetKey === widgetKey);
  if (existing) {
    return widgets.map((w) => (w.widgetKey === widgetKey ? { ...w, visible: true } : w));
  }
  const def = defByKey(widgetKey);
  if (!def) return widgets;
  return [
    ...widgets,
    {
      id: `w-${widgetKey}-${widgets.length}`,
      widgetKey,
      position: widgets.length,
      size: def.defaultSize,
      visible: true,
      config: null,
    },
  ];
}
