import { z } from "zod";
import { DEBT_TYPES } from "./enums";

export const debtSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(DEBT_TYPES),
  currentBalanceCents: z.number().int(),
  originalBalanceCents: z.number().int().nullable(),
  creditLimitCents: z.number().int().nullable(),
  monthlyPaymentCents: z.number().int(),
  minimumPaymentCents: z.number().int().nullable(),
  interestRate: z.number().nullable(),
  monthlyFeeCents: z.number().int().nullable(),
  feeDueDay: z.number().int().nullable(),
  lastFeeAppliedAt: z.string().nullable(),
  payoffPriority: z.number().int().default(999),
  includeInSnowball: z.boolean().default(true),
  includeInNetWorth: z.boolean().default(true),
  matchRuleId: z.string().nullable(),
  paymentsLinkedAt: z.string().nullable().default(null),
  accountNumber: z.string().nullable(),
  institutionName: z.string().nullable(),
  notes: z.string().nullable(),
  estimatedPayoffDate: z.string().nullable(),
  monthsRemaining: z.number().int().nullable(),
  totalInterestProjectedCents: z.number().int().nullable(),
});
export type Debt = z.infer<typeof debtSchema>;

export const debtPaymentSchema = z.object({
  id: z.string(),
  debtId: z.string(),
  transactionId: z.string().nullable(),
  amountCents: z.number().int(),
  principalCents: z.number().int().nullable(),
  interestCents: z.number().int().nullable(),
  paymentDate: z.string(),
  notes: z.string().nullable(),
});
export type DebtPayment = z.infer<typeof debtPaymentSchema>;

export const debtExpenseSchema = z.object({
  id: z.string(),
  debtId: z.string(),
  description: z.string(),
  amountCents: z.number().int(),
  merchant: z.string().nullable(),
  note: z.string().nullable(),
  date: z.string(),
});
export type DebtExpense = z.infer<typeof debtExpenseSchema>;
