import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { accounts } from "./accounts";

export const budgetAllocations = sqliteTable(
  "budget_allocations",
  {
    id: text().primaryKey(),
    accountId: text().notNull().references(() => accounts.id),
    month: text().notNull(),
    year: integer().notNull(),
    allocatedCents: integer().notNull(),
    spentCents: integer().notNull().default(0),
    varianceCents: integer().notNull(),
    notes: text(),
  },
  (t) => [
    uniqueIndex("budget_account_month_uq").on(t.accountId, t.month),
    index("budget_month_idx").on(t.month),
    index("budget_year_idx").on(t.year),
  ],
);
