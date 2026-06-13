import type { AppSettings } from "@upshot/contracts";

export interface SettingsRepo {
  get(): Promise<AppSettings | null>;
}
