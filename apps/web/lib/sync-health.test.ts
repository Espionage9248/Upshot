import { afterEach, describe, it, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { SyncHealth } from "@upshot/core";
import {
  createDbClient,
  applyMigrations,
  seed,
  DrizzleJobRunRepo,
  type DbClient,
} from "@upshot/db";
import { loadSyncHealth, syncHealthToState } from "./sync-health";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function freshDb(): DbClient {
  const dir = mkdtempSync(join(tmpdir(), "upshot-synchealth-"));
  dirs.push(dir);
  const { db } = createDbClient({ url: join(dir, "x.db"), key: KEY });
  applyMigrations(db as DbClient);
  seed(db as DbClient);
  return db as DbClient;
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

const NOW = new Date("2026-06-13T10:00:00.000Z");

const base: SyncHealth = {
  lastSyncAt: "2026-06-13T09:00:00.000Z",
  lastSyncAgeMs: 60_000,
  lastStatus: "SUCCESS",
  tokenHealthy: true,
};

describe("loadSyncHealth", () => {
  it("derives tokenHealthy false from a FAILED 401 run", async () => {
    const db = freshDb();
    const jr = new DrizzleJobRunRepo(db);
    await jr.create({ id: "j1", job: "SYNC", startedAt: "2026-06-13T09:00:00.000Z" });
    await jr.finish("j1", {
      status: "FAILED",
      finishedAt: "2026-06-13T09:00:05.000Z",
      cursor: null,
      counts: null,
      error: "Up API auth failed (HTTP 401)",
    });

    const health = await loadSyncHealth(db, NOW);

    expect(health.lastStatus).toBe("FAILED");
    expect(health.tokenHealthy).toBe(false);
  });

  it("reports tokenHealthy when the latest SYNC run succeeded", async () => {
    const db = freshDb();
    const jr = new DrizzleJobRunRepo(db);
    await jr.create({ id: "ok", job: "SYNC", startedAt: "2026-06-13T08:00:00.000Z" });
    await jr.finish("ok", {
      status: "SUCCESS",
      finishedAt: "2026-06-13T08:00:05.000Z",
      cursor: "cursor-1",
      counts: null,
      error: null,
    });

    const health = await loadSyncHealth(db, NOW);

    expect(health.lastStatus).toBe("SUCCESS");
    expect(health.tokenHealthy).toBe(true);
  });
});

describe("syncHealthToState", () => {
  it("maps !tokenHealthy → token regardless of status", () => {
    expect(syncHealthToState({ ...base, tokenHealthy: false, lastStatus: "SUCCESS" })).toBe(
      "token",
    );
  });
  it("maps FAILED → failed", () => {
    expect(syncHealthToState({ ...base, lastStatus: "FAILED" })).toBe("failed");
  });
  it("maps RUNNING → syncing", () => {
    expect(syncHealthToState({ ...base, lastStatus: "RUNNING" })).toBe("syncing");
  });
  it("maps SUCCESS → healthy", () => {
    expect(syncHealthToState({ ...base, lastStatus: "SUCCESS" })).toBe("healthy");
  });
});
