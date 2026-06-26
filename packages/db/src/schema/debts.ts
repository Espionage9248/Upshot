import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { DEBT_TYPES } from "@upshot/contracts";
import { matchRules } from "./match-rules";
import { transactions } from "./transactions";

export const debts = sqliteTable(
  "debts",
  {
    id: text().primaryKey(),
    name: text().notNull(),
    type: text({ enum: DEBT_TYPES }).notNull(),
    currentBalanceCents: integer().notNull(),
    originalBalanceCents: integer(),
    creditLimitCents: integer(),
    monthlyPaymentCents: integer().notNull(),
    minimumPaymentCents: integer(),
    interestRate: real(),
    monthlyFeeCents: integer(),
    feeDueDay: integer(),
    lastFeeAppliedAt: text(),
    payoffPriority: integer().notNull().default(999),
    includeInSnowball: integer({ mode: "boolean" }).notNull().default(true),
    includeInNetWorth: integer({ mode: "boolean" }).notNull().default(true),
    matchRuleId: text().references(() => matchRules.id),
    paymentsLinkedAt: text(),
    accountNumber: text(),
    institutionName: text(),
    notes: text(),
    estimatedPayoffDate: text(),
    monthsRemaining: integer(),
    totalInterestProjectedCents: integer(),
  },
  (t) => [index("debts_type_idx").on(t.type), index("debts_priority_idx").on(t.payoffPriority)],
);

export const debtPayments = sqliteTable("debt_payments", {
  id: text().primaryKey(),
  debtId: text().notNull().references(() => debts.id, { onDelete: "cascade" }),
  transactionId: text().references(() => transactions.id),
  amountCents: integer().notNull(),
  principalCents: integer(),
  interestCents: integer(),
  paymentDate: text().notNull(),
  notes: text(),
});

export const debtExpenses = sqliteTable("debt_expenses", {
  id: text().primaryKey(),
  debtId: text().notNull().references(() => debts.id, { onDelete: "cascade" }),
  description: text().notNull(),
  amountCents: integer().notNull(),
  merchant: text(),
  note: text(),
  date: text().notNull(),
});
