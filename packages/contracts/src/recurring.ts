import { z } from "zod";
import { RECURRING_KINDS, RECURRING_FREQUENCIES, RECURRING_STATUSES } from "./enums";

export const recurringItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(RECURRING_KINDS),
  amountCents: z.number().int(),
  frequency: z.enum(RECURRING_FREQUENCIES),
  lastAmountCents: z.number().int().nullable(),
  priceLastChangedAt: z.string().nullable(),
  usageCount: z.number().int().default(0),
  usageResetAt: z.string().nullable(),
  category: z.string().nullable(),
  merchant: z.string().nullable(),
  status: z.enum(RECURRING_STATUSES),
  matchRuleId: z.string().nullable(),
  nextExpectedDate: z.string().nullable(),
  lastDetectedDate: z.string().nullable(),
  firstDetectedDate: z.string().nullable(),
  accountId: z.string().nullable(),
  isAutoDetected: z.boolean().default(false),
  notes: z.string().nullable(),
});
export type RecurringItem = z.infer<typeof recurringItemSchema>;
