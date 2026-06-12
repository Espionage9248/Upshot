import { sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";
import { transactions } from "./transactions";

export const tags = sqliteTable("tags", {
  id: text().primaryKey(),
  createdAt: text().notNull().$defaultFn(() => new Date().toISOString()),
});

export const transactionTags = sqliteTable(
  "transaction_tags",
  {
    transactionId: text().notNull().references(() => transactions.id, { onDelete: "cascade" }),
    tagId: text().notNull().references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.transactionId, t.tagId] })],
);
