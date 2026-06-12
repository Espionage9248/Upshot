import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";

export const twoUpTransactions = sqliteTable(
  "two_up_transactions",
  {
    id: text().primaryKey(),
    rowHash: text().notNull(),
    date: text().notNull(),
    description: text().notNull(),
    amountCents: integer().notNull(),
    contributor: text(),
    category: text(),
  },
  (t) => [uniqueIndex("two_up_rowhash_uq").on(t.rowHash)],
);
