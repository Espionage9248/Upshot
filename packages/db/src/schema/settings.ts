import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { SYNC_CADENCES } from "@upshot/contracts";

export const appSettings = sqliteTable("app_settings", {
  id: text().primaryKey().default("default"),
  syncCadence: text({ enum: SYNC_CADENCES }).notNull().default("DAILY"),
  wifiOnlySync: integer({ mode: "boolean" }).notNull().default(false),
  backgroundRefresh: integer({ mode: "boolean" }).notNull().default(true),
  notifyOnSyncFail: integer({ mode: "boolean" }).notNull().default(true),
  autoDetectRecurring: integer({ mode: "boolean" }).notNull().default(true),
  autoCategorise: integer({ mode: "boolean" }).notNull().default(true),
  nightlyBackup: integer({ mode: "boolean" }).notNull().default(true),
  debtStrategy: text().notNull().default("SNOWBALL"),
  extraPaymentCents: integer().notNull().default(0),
  bigPurchaseThresholdCents: integer().notNull().default(0),
  currency: text().notNull().default("AUD"),
  dateFormat: text().notNull().default("DD/MM/YYYY"),
  financialYearStartMonth: integer().notNull().default(7),
  medicareLevyApplies: integer({ mode: "boolean" }).notNull().default(true),
  updatedAt: text().notNull().$defaultFn(() => new Date().toISOString()),
});
