import { eq } from "drizzle-orm";
import type { SettingsRepo, SettingsPatch } from "@upshot/core";
import type { AppSettings } from "@upshot/contracts";
import type { DbClient } from "../client";
import { appSettings } from "../schema";

export class DrizzleSettingsRepo implements SettingsRepo {
  constructor(private readonly db: DbClient) {}

  async get(): Promise<AppSettings | null> {
    return this.db.select().from(appSettings).where(eq(appSettings.id, "default")).get() ?? null;
  }

  async update(patch: SettingsPatch): Promise<AppSettings> {
    const now = new Date().toISOString();
    // Upsert the singleton row: a fresh web DB may be unseeded, so the row may
    // not exist yet. Insert the patch (column defaults fill the rest); on
    // conflict, apply only the patched fields. updatedAt always refreshes.
    return this.db
      .insert(appSettings)
      .values({ id: "default", ...patch, updatedAt: now })
      .onConflictDoUpdate({
        target: appSettings.id,
        set: { ...patch, updatedAt: now },
      })
      .returning()
      .get();
  }
}
