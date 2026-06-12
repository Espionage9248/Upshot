import { z } from "zod";
import { ASSET_TYPES } from "./enums";

export const assetSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(ASSET_TYPES),
  valueCents: z.number().int(),
  institution: z.string().nullable(),
  notes: z.string().nullable(),
  includeInNetWorth: z.boolean().default(true),
  lastValuedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Asset = z.infer<typeof assetSchema>;

export const assetValuationSchema = z.object({
  id: z.string(),
  assetId: z.string(),
  valueCents: z.number().int(),
  valuedAt: z.string(),
});
export type AssetValuation = z.infer<typeof assetValuationSchema>;
