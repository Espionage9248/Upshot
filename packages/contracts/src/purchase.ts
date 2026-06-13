import { z } from "zod";
import { PURCHASE_STATUSES } from "./enums";

export const purchaseSchema = z.object({
  id: z.string(),
  customName: z.string().nullable(),
  status: z.enum(PURCHASE_STATUSES),
  transactionId: z.string().nullable(),
  priceCents: z.number().int().nullable(),
  currency: z.string().default("AUD"),
  merchant: z.string().nullable(),
  category: z.string().nullable(),
  purchaseDate: z.string().nullable(),
  targetDate: z.string().nullable(),
  targetPriceCents: z.number().int().nullable(),
  priority: z.number().int().nullable(),
  url: z.string().nullable(),
  notes: z.string().nullable(),
});
export type Purchase = z.infer<typeof purchaseSchema>;

export const purchaseImageSchema = z.object({
  id: z.string(),
  purchaseId: z.string(),
  url: z.string(),
});
export type PurchaseImage = z.infer<typeof purchaseImageSchema>;
