import { afterEach, describe, it, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDbClient, applyMigrations, DrizzleSettingsRepo, type DbClient } from "@upshot/db";
import { setCadence, setAutomationFlag, loadSettings } from "./settings-core";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function freshDb(): DbClient {
  const dir = mkdtempSync(join(tmpdir(), "upshot-settings-core-"));
  dirs.push(dir);
  const { db } = createDbClient({ url: join(dir, "x.db"), key: KEY });
  applyMigrations(db as DbClient);
  return db as DbClient;
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

describe("settings-core", () => {
  it("setCadence persists to app_settings (upserts into a fresh, unseeded DB)", async () => {
    const db = freshDb();
    const repo = new DrizzleSettingsRepo(db);
    expect(await repo.get()).toBeNull(); // unseeded

    const res = await setCadence(db, "HOURLY");
    expect(res.syncCadence).toBe("HOURLY");
    expect((await repo.get())?.syncCadence).toBe("HOURLY");
  });

  it("setCadence rejects an invalid cadence and does not persist", async () => {
    const db = freshDb();
    const repo = new DrizzleSettingsRepo(db);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect(setCadence(db, "NOPE" as any)).rejects.toThrow();
    expect(await repo.get()).toBeNull();
  });

  it("setAutomationFlag persists a boolean flag", async () => {
    const db = freshDb();
    const repo = new DrizzleSettingsRepo(db);
    const res = await setAutomationFlag(db, "wifiOnlySync", true);
    expect(res.wifiOnlySync).toBe(true);
    expect((await repo.get())?.wifiOnlySync).toBe(true);
  });

  it("setAutomationFlag rejects an unknown key and does not persist", async () => {
    const db = freshDb();
    const repo = new DrizzleSettingsRepo(db);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect(setAutomationFlag(db, "notAField" as any, true)).rejects.toThrow();
    expect(await repo.get()).toBeNull();
  });

  it("loadSettings returns null on an unseeded DB and the row after a write", async () => {
    const db = freshDb();
    expect(await loadSettings(db)).toBeNull();
    await setCadence(db, "REALTIME");
    expect((await loadSettings(db))?.syncCadence).toBe("REALTIME");
  });
});
