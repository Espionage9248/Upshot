import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const dashboardWidgets = sqliteTable("dashboard_widgets", {
  id: text().primaryKey(),
  widgetKey: text().notNull(),
  position: integer().notNull(),
  size: text().notNull(),
  visible: integer({ mode: "boolean" }).notNull().default(true),
  config: text({ mode: "json" }).$type<Record<string, unknown>>(),
});
