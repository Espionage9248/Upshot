import { z } from "zod";

export const monthlySnapshotSchema = z.object({
  id: z.string(),
  month: z.string(), // "YYYY-MM"
  incomeCents: z.number().int(),
  expenseCents: z.number().int(),
  savedCents: z.number().int(),
  debtCents: z.number().int(),
  assetsCents: z.number().int(),
  netWorthCents: z.number().int(),
  createdAt: z.string(),
});
export type MonthlySnapshot = z.infer<typeof monthlySnapshotSchema>;

export const monthlySnapshotCategorySchema = z.object({
  id: z.string(),
  snapshotId: z.string(),
  categoryName: z.string(),
  amountCents: z.number().int(),
});
export type MonthlySnapshotCategory = z.infer<typeof monthlySnapshotCategorySchema>;
