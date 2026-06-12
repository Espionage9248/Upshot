import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { TRANSACTION_STATUSES } from "@upshot/contracts";
import { accounts } from "./accounts";
import { categories } from "./categories";

export const transactions = sqliteTable(
  "transactions",
  {
    id: text().primaryKey(),
    accountId: text().notNull().references(() => accounts.id),
    status: text({ enum: TRANSACTION_STATUSES }).notNull(),
    description: text().notNull(),
    message: text(),
    rawText: text(),
    amountCents: integer().notNull(),
    currency: text().notNull().default("AUD"),
    foreignAmountCents: integer(),
    foreignCurrency: text(),
    categoryId: text().references(() => categories.id),
    parentCategoryId: text(),
    isTransfer: integer({ mode: "boolean" }).notNull().default(false),
    transferAccountId: text(),
    isSalary: integer({ mode: "boolean" }).notNull().default(false),
    isInterest: integer({ mode: "boolean" }).notNull().default(false),
    isTaxDeductible: integer({ mode: "boolean" }).notNull().default(false),
    taxDeductionCategory: text(),
    cardPurchaseMethod: text(),
    cardNumberSuffix: text(),
    roundUpCents: integer(),
    cashbackCents: integer(),
    note: text(),
    attachmentId: text(),
    attachmentUrl: text(),
    settledAt: text(),
    createdAt: text().notNull(),
  },
  (t) => [
    index("transactions_account_idx").on(t.accountId),
    index("transactions_status_idx").on(t.status),
    index("transactions_created_idx").on(t.createdAt),
    index("transactions_category_idx").on(t.categoryId),
    index("transactions_salary_idx").on(t.isSalary),
    index("transactions_transfer_idx").on(t.isTransfer),
    index("transactions_interest_idx").on(t.isInterest),
    index("transactions_deductible_idx").on(t.isTaxDeductible),
  ],
);
