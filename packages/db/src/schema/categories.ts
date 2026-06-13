import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const categories = sqliteTable("categories", {
  id: text().primaryKey(),
  name: text().notNull(),
  parentId: text(),
});
