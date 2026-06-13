import type { AppSettings } from "@upshot/contracts";
import type { SettingsRepo } from "../ports/settings-repo";

export class InMemorySettingsRepo implements SettingsRepo {
  constructor(private readonly settings: AppSettings | null) {}

  async get(): Promise<AppSettings | null> {
    return this.settings;
  }
}
