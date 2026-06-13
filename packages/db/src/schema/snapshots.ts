import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";

export const monthlySnapshots = sqliteTable(
  "monthly_snapshots",
  {
    id: text().primaryKey(),
    month: text().notNull(),
    incomeCents: integer().notNull(),
    expenseCents: integer().notNull(),
    savedCents: integer().notNull(),
    debtCents: integer().notNull(),
    assetsCents: integer().notNull(),
    netWorthCents: integer().notNull(),
    createdAt: text().notNull().$defaultFn(() => new Date().toISOString()),
  },
  (t) => [uniqueIndex("snapshots_month_uq").on(t.month)],
);

export const monthlySnapshotCategories = sqliteTable("monthly_snapshot_categories", {
  id: text().primaryKey(),
  snapshotId: text().notNull().references(() => monthlySnapshots.id, { onDelete: "cascade" }),
  categoryName: text().notNull(),
  amountCents: integer().notNull(),
});
