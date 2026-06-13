import { z } from "zod";

export const twoUpTransactionSchema = z.object({
  id: z.string(),
  rowHash: z.string(),
  date: z.string(),
  description: z.string(),
  amountCents: z.number().int(),
  contributor: z.string().nullable(),
  category: z.string().nullable(),
});
export type TwoUpTransaction = z.infer<typeof twoUpTransactionSchema>;
