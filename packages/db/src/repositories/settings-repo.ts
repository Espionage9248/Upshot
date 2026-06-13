import { eq } from "drizzle-orm";
import type { SettingsRepo } from "@upshot/core";
import type { AppSettings } from "@upshot/contracts";
import type { DbClient } from "../client";
import { appSettings } from "../schema";

export class DrizzleSettingsRepo implements SettingsRepo {
  constructor(private readonly db: DbClient) {}

  async get(): Promise<AppSettings | null> {
    return this.db.select().from(appSettings).where(eq(appSettings.id, "default")).get() ?? null;
  }
}
