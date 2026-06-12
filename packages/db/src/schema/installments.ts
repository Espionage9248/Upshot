import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { INSTALLMENT_STATUSES } from "@upshot/contracts";
import { matchRules } from "./match-rules";
import { transactions } from "./transactions";

export const installmentPlans = sqliteTable("installment_plans", {
  id: text().primaryKey(),
  merchant: text().notNull(),
  totalCents: integer().notNull(),
  installmentCents: integer().notNull(),
  totalInstallments: integer().notNull(),
  installmentsPaid: integer().notNull().default(0),
  frequencyDays: integer().notNull().default(14),
  firstDueDate: text().notNull(),
  nextDueDate: text().notNull(),
  status: text({ enum: INSTALLMENT_STATUSES }).notNull(),
  matchRuleId: text().references(() => matchRules.id),
  notes: text(),
});

export const installmentPlanPayments = sqliteTable("installment_plan_payments", {
  id: text().primaryKey(),
  planId: text().notNull().references(() => installmentPlans.id, { onDelete: "cascade" }),
  transactionId: text().notNull().references(() => transactions.id),
  dueIndex: integer().notNull(),
  paidAt: text().notNull(),
});
