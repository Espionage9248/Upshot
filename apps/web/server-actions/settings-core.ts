/**
 * Pure settings persistence (db-injected, no auth/Next concerns).
 *
 * Kept out of the "use server" module so these helpers are NOT registered as
 * client-callable Server Actions (they take a non-serializable DbClient). The
 * thin auth-guarded action wrappers live in `settings.ts` and delegate here —
 * the same split as dashboard-core.ts.
 *
 * Validation (cadence + flag key) lives here: an invalid value throws, which the
 * action() wrapper maps to a safe ActionResult error.
 *
 * Cadence values + the app_settings row shape are defined/derived locally rather
 * than imported from @upshot/contracts (not a dep of apps/web) — mirroring the
 * local-type approach in dashboard-core.ts.
 */

import { tables, DrizzleSettingsRepo, type DbClient } from "@upshot/db";

/** The app_settings row shape (inferred from the Drizzle schema). */
export type AppSettings = typeof tables.appSettings.$inferSelect;

/** Sync cadences (mirrors @upshot/contracts SYNC_CADENCES). */
export const SYNC_CADENCES = ["REALTIME", "HOURLY", "DAILY"] as const;
export type SyncCadence = (typeof SYNC_CADENCES)[number];

/** The boolean automation flags the UI may toggle (a closed allow-list). */
export const AUTOMATION_FLAGS = [
  "wifiOnlySync",
  "backgroundRefresh",
  "notifyOnSyncFail",
  "autoDetectRecurring",
  "autoCategorise",
  "nightlyBackup",
] as const;

export type AutomationFlag = (typeof AUTOMATION_FLAGS)[number];

/** Load the persisted settings (null on a fresh, unseeded DB). db-injected + pure. */
export async function loadSettings(db: DbClient): Promise<AppSettings | null> {
  return new DrizzleSettingsRepo(db).get();
}

/** Persist the sync cadence. Throws on an invalid cadence (rejected before any write). */
export async function setCadence(db: DbClient, cadence: SyncCadence): Promise<AppSettings> {
  if (!SYNC_CADENCES.includes(cadence)) {
    throw new Error("Invalid sync cadence");
  }
  return new DrizzleSettingsRepo(db).update({ syncCadence: cadence });
}

/** Persist a single automation flag. Throws on an unknown key (rejected before any write). */
export async function setAutomationFlag(
  db: DbClient,
  key: AutomationFlag,
  on: boolean,
): Promise<AppSettings> {
  if (!AUTOMATION_FLAGS.includes(key)) {
    throw new Error("Unknown automation flag");
  }
  return new DrizzleSettingsRepo(db).update({ [key]: on });
}

/**
 * Persist the annual tax income inputs (gross income + PAYG withheld). Both are
 * integer cents ≥ 0 (a UI/programmer guard — an invalid value throws and the
 * action() wrapper maps it to a safe error).
 */
export async function updateTaxIncome(
  db: DbClient,
  input: { taxableIncomeGrossCents: number; paygWithheldCents: number },
): Promise<AppSettings> {
  const { taxableIncomeGrossCents, paygWithheldCents } = input;
  for (const v of [taxableIncomeGrossCents, paygWithheldCents]) {
    if (!Number.isInteger(v) || v < 0) throw new Error("Invalid tax income input");
  }
  return new DrizzleSettingsRepo(db).update({ taxableIncomeGrossCents, paygWithheldCents });
}

/**
 * Persist the tax settings. The financial-year start month must be an integer
 * in 1..12 (a UI/programmer guard, so an out-of-range value throws — the
 * action() wrapper maps it to a safe error rather than a user-facing result).
 */
export async function updateTaxSettings(
  db: DbClient,
  input: { financialYearStartMonth: number; medicareLevyApplies: boolean },
): Promise<AppSettings> {
  const month = input.financialYearStartMonth;
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Invalid financial year start month");
  }
  return new DrizzleSettingsRepo(db).update({
    financialYearStartMonth: month,
    medicareLevyApplies: input.medicareLevyApplies,
  });
}
