import type { AppSettings } from "@upshot/contracts";

/** Writable fields of app_settings (id + updatedAt are managed by the repo). */
export type SettingsPatch = Partial<Omit<AppSettings, "id" | "updatedAt">>;

export interface SettingsRepo {
  get(): Promise<AppSettings | null>;
  update(patch: SettingsPatch): Promise<AppSettings>;
}
