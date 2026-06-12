import { z } from "zod";
import { TRANSACTION_STATUSES } from "./enums";

export const transactionSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  status: z.enum(TRANSACTION_STATUSES),
  description: z.string(),
  message: z.string().nullable(),
  rawText: z.string().nullable(),
  amountCents: z.number().int(),
  currency: z.string().default("AUD"),
  foreignAmountCents: z.number().int().nullable(),
  foreignCurrency: z.string().nullable(),
  categoryId: z.string().nullable(),
  parentCategoryId: z.string().nullable(),
  isTransfer: z.boolean().default(false),
  transferAccountId: z.string().nullable(),
  isSalary: z.boolean().default(false),
  isInterest: z.boolean().default(false),
  isTaxDeductible: z.boolean().default(false),
  taxDeductionCategory: z.string().nullable(),
  cardPurchaseMethod: z.string().nullable(),
  cardNumberSuffix: z.string().nullable(),
  roundUpCents: z.number().int().nullable(),
  cashbackCents: z.number().int().nullable(),
  note: z.string().nullable(),
  attachmentId: z.string().nullable(),
  attachmentUrl: z.string().nullable(),
  settledAt: z.string().nullable(),
  createdAt: z.string(),
});
export type Transaction = z.infer<typeof transactionSchema>;
