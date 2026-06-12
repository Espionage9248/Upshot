import { z } from "zod";

export const budgetAllocationSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  month: z.string(), // "YYYY-MM"
  year: z.number().int(),
  allocatedCents: z.number().int(),
  spentCents: z.number().int().default(0),
  varianceCents: z.number().int(),
  notes: z.string().nullable(),
});
export type BudgetAllocation = z.infer<typeof budgetAllocationSchema>;
