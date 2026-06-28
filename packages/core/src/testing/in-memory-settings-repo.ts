import type { AppSettings } from "@upshot/contracts";
import type { SettingsRepo, SettingsPatch } from "../ports/settings-repo";

export class InMemorySettingsRepo implements SettingsRepo {
  constructor(private settings: AppSettings | null) {}

  async get(): Promise<AppSettings | null> {
    return this.settings;
  }

  async update(patch: SettingsPatch): Promise<AppSettings> {
    const base: AppSettings = this.settings ?? {
      id: "default",
      syncCadence: "DAILY",
      wifiOnlySync: false,
      backgroundRefresh: true,
      notifyOnSyncFail: true,
      autoDetectRecurring: true,
      autoCategorise: true,
      nightlyBackup: true,
      debtStrategy: "SNOWBALL",
      extraPaymentCents: 0,
      bigPurchaseThresholdCents: 0,
      currency: "AUD",
      dateFormat: "DD/MM/YYYY",
      financialYearStartMonth: 7,
      medicareLevyApplies: true,
      taxableIncomeGrossCents: 0,
      paygWithheldCents: 0,
      updatedAt: new Date().toISOString(),
    };
    this.settings = { ...base, ...patch, updatedAt: new Date().toISOString() };
    return this.settings;
  }
}
