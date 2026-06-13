import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { PURCHASE_STATUSES } from "@upshot/contracts";
import { transactions } from "./transactions";

export const purchases = sqliteTable("purchases", {
  id: text().primaryKey(),
  customName: text(),
  status: text({ enum: PURCHASE_STATUSES }).notNull(),
  transactionId: text().unique().references(() => transactions.id),
  priceCents: integer(),
  currency: text().notNull().default("AUD"),
  merchant: text(),
  category: text(),
  purchaseDate: text(),
  targetDate: text(),
  targetPriceCents: integer(),
  priority: integer(),
  url: text(),
  notes: text(),
});

export const purchaseImages = sqliteTable("purchase_images", {
  id: text().primaryKey(),
  purchaseId: text().notNull().references(() => purchases.id, { onDelete: "cascade" }),
  url: text().notNull(),
});
