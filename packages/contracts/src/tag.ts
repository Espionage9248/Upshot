import { z } from "zod";

export const tagSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
});
export type Tag = z.infer<typeof tagSchema>;

export const transactionTagSchema = z.object({
  transactionId: z.string(),
  tagId: z.string(),
});
export type TransactionTag = z.infer<typeof transactionTagSchema>;
