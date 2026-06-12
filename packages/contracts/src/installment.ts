import { z } from "zod";
import { INSTALLMENT_STATUSES } from "./enums";

export const installmentPlanSchema = z.object({
  id: z.string(),
  merchant: z.string(),
  totalCents: z.number().int(),
  installmentCents: z.number().int(),
  totalInstallments: z.number().int(),
  installmentsPaid: z.number().int().default(0),
  frequencyDays: z.number().int().default(14),
  firstDueDate: z.string(),
  nextDueDate: z.string(),
  status: z.enum(INSTALLMENT_STATUSES),
  matchRuleId: z.string().nullable(),
  notes: z.string().nullable(),
});
export type InstallmentPlan = z.infer<typeof installmentPlanSchema>;

export const installmentPlanPaymentSchema = z.object({
  id: z.string(),
  planId: z.string(),
  transactionId: z.string(),
  dueIndex: z.number().int(),
  paidAt: z.string(),
});
export type InstallmentPlanPayment = z.infer<typeof installmentPlanPaymentSchema>;
