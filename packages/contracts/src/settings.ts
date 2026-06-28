import { z } from "zod";
import { SYNC_CADENCES } from "./enums";

export type SyncCadence = (typeof SYNC_CADENCES)[number];

export const appSettingsSchema = z.object({
  id: z.string().default("default"),
  syncCadence: z.enum(SYNC_CADENCES).default("DAILY"),
  wifiOnlySync: z.boolean().default(false),
  backgroundRefresh: z.boolean().default(true),
  notifyOnSyncFail: z.boolean().default(true),
  autoDetectRecurring: z.boolean().default(true),
  autoCategorise: z.boolean().default(true),
  nightlyBackup: z.boolean().default(true),
  debtStrategy: z.string().default("SNOWBALL"),
  extraPaymentCents: z.number().int().default(0),
  bigPurchaseThresholdCents: z.number().int().default(0),
  currency: z.string().default("AUD"),
  dateFormat: z.string().default("DD/MM/YYYY"),
  financialYearStartMonth: z.number().int().default(7),
  medicareLevyApplies: z.boolean().default(true),
  taxableIncomeGrossCents: z.number().int().default(0),
  paygWithheldCents: z.number().int().default(0),
  updatedAt: z.string(),
});
export type AppSettings = z.infer<typeof appSettingsSchema>;
