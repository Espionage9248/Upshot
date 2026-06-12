import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const eventLog = sqliteTable("event_log", {
  id: text().primaryKey(),
  category: text().notNull(),
  action: text().notNull(),
  entityType: text(),
  entityId: text(),
  entityName: text(),
  description: text().notNull(),
  before: text({ mode: "json" }).$type<Record<string, unknown>>(),
  after: text({ mode: "json" }).$type<Record<string, unknown>>(),
  meta: text({ mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: text().notNull().$defaultFn(() => new Date().toISOString()),
});
