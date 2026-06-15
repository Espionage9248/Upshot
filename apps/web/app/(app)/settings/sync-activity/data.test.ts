import { afterEach, describe, it, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDbClient, applyMigrations, tables, type DbClient } from "@upshot/db";
import { loadSyncActivity } from "./data";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function freshDb(): DbClient {
  const dir = mkdtempSync(join(tmpdir(), "upshot-sync-activity-"));
  dirs.push(dir);
  const { db } = createDbClient({ url: join(dir, "x.db"), key: KEY });
  applyMigrations(db as DbClient);
  return db as DbClient;
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

describe("loadSyncActivity", () => {
  it("derives run display states (success / running / failed / token-401) + reconnect treatment", async () => {
    const db = freshDb();
    db.insert(tables.jobRuns)
      .values([
        {
          id: "r-success",
          job: "SYNC",
          status: "SUCCESS",
          startedAt: "2026-06-14T10:00:00.000Z",
          finishedAt: "2026-06-14T10:00:02.100Z",
          counts: { txns: 312, new: 1 },
        },
        {
          id: "r-running",
          job: "SYNC",
          status: "RUNNING",
          startedAt: "2026-06-14T11:00:00.000Z",
          finishedAt: null,
        },
        {
          id: "r-token",
          job: "SYNC",
          status: "FAILED",
          startedAt: "2026-06-13T09:00:00.000Z",
          finishedAt: "2026-06-13T09:00:01.000Z",
          error: "Up API auth failed (HTTP 401)",
        },
        {
          id: "r-failed",
          job: "FEES",
          status: "FAILED",
          startedAt: "2026-06-12T09:00:00.000Z",
          finishedAt: "2026-06-12T09:00:01.000Z",
          error: "network timeout",
        },
      ])
      .run();

    const data = await loadSyncActivity(db, new Date("2026-06-14T11:05:00.000Z"));

    const byId = Object.fromEntries(data.runs.map((r) => [r.id, r]));
    expect(byId["r-success"]?.state).toBe("success");
    expect(byId["r-running"]?.state).toBe("running");
    expect(byId["r-token"]?.state).toBe("token");
    expect(byId["r-failed"]?.state).toBe("failed");

    // Token row is the reconnect affordance carrier.
    expect(byId["r-token"]?.reconnect).toBe(true);
    expect(byId["r-success"]?.reconnect).toBe(false);

    // Job → human label + icon.
    expect(byId["r-success"]?.jobLabel).toBe("Transaction sync");
    expect(byId["r-success"]?.icon).toBe("sync");
    expect(byId["r-failed"]?.jobLabel).toBe("Fee scan");
    expect(byId["r-failed"]?.icon).toBe("percent");

    // Duration: finishedAt − startedAt formatted; running has no finish.
    expect(byId["r-success"]?.duration).toBe("2.1s");
    expect(byId["r-running"]?.duration).toBe("—");

    // Result summary derives from counts / error (no raw secrets).
    expect(byId["r-success"]?.result).toContain("312");
    expect(byId["r-token"]?.result.toLowerCase()).toContain("401");

    // Newest started run first.
    expect(data.runs[0]?.id).toBe("r-running");

    // Health pill reflects the latest SYNC run = the RUNNING one.
    expect(data.health.lastStatus).toBe("RUNNING");
  });

  it("returns event_log activity rows in createdAt-desc order with descriptions", async () => {
    const db = freshDb();
    db.insert(tables.eventLog)
      .values([
        {
          id: "e-old",
          category: "rule",
          action: "create",
          description: "Created rule — merchant contains woolworths",
          createdAt: "2026-06-10T08:00:00.000Z",
        },
        {
          id: "e-new",
          category: "transaction",
          action: "flag",
          description: "Flagged Officeworks as a tax deduction",
          createdAt: "2026-06-14T08:00:00.000Z",
        },
      ])
      .run();

    const data = await loadSyncActivity(db, new Date("2026-06-14T12:00:00.000Z"));

    expect(data.activity.map((a) => a.id)).toEqual(["e-new", "e-old"]);
    expect(data.activity[0]?.description).toBe("Flagged Officeworks as a tax deduction");
  });

  it("returns empty arrays and tokenHealthy health on a fresh DB", async () => {
    const db = freshDb();
    const data = await loadSyncActivity(db, new Date("2026-06-14T12:00:00.000Z"));
    expect(data.runs).toEqual([]);
    expect(data.activity).toEqual([]);
    expect(data.health.lastStatus).toBeNull();
    expect(data.lastSyncAt).toBeNull();
  });
});
