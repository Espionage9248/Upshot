import { afterEach, describe, it, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createDbClient,
  applyMigrations,
  seed,
  DrizzleAccountRepo,
  DrizzleJobRunRepo,
  tables,
  type DbClient,
} from "@upshot/db";
import { loadTodayData } from "./data";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function freshDb(): DbClient {
  const dir = mkdtempSync(join(tmpdir(), "upshot-today-"));
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

describe("loadTodayData", () => {
  it("derives sync health (FAILED 401 → tokenHealthy false) from the latest SYNC run", async () => {
    const db = freshDb();
    const jr = new DrizzleJobRunRepo(db);
    // An earlier SUCCESS run, then a later FAILED-401 run; latest by startedAt is the failure.
    await jr.create({ id: "j0", job: "SYNC", startedAt: "2026-06-13T08:00:00.000Z" });
    await jr.finish("j0", {
      status: "SUCCESS",
      finishedAt: "2026-06-13T08:00:05.000Z",
      cursor: "cursor-1",
      counts: null,
      error: null,
    });
    await jr.create({ id: "j1", job: "SYNC", startedAt: "2026-06-13T09:00:00.000Z" });
    await jr.finish("j1", {
      status: "FAILED",
      finishedAt: "2026-06-13T09:00:05.000Z",
      cursor: null,
      counts: null,
      error: "Up API auth failed (HTTP 401)",
    });

    const result = await loadTodayData(db, NOW);

    expect(result.syncHealth.lastStatus).toBe("FAILED");
    expect(result.syncHealth.tokenHealthy).toBe(false);
    expect(result.syncHealth.lastSyncAt).toBe("2026-06-13T09:00:05.000Z");
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

    const result = await loadTodayData(db, NOW);

    expect(result.syncHealth.lastStatus).toBe("SUCCESS");
    expect(result.syncHealth.tokenHealthy).toBe(true);
  });

  it("returns accounts with balances and an integer net-worth sum", async () => {
    const db = freshDb();
    const accounts = new DrizzleAccountRepo(db);
    await accounts.upsert({
      id: "acc-spend",
      name: "Spending",
      type: "TRANSACTIONAL",
      ownership: "INDIVIDUAL",
      balanceCents: 123456,
      role: "SPENDING",
      monthlyAllocationCents: 0,
      lastSyncedAt: null,
    });
    await accounts.upsert({
      id: "acc-save",
      name: "Saver",
      type: "SAVER",
      ownership: "INDIVIDUAL",
      balanceCents: 1000000,
      role: "SAVER",
      monthlyAllocationCents: 0,
      lastSyncedAt: null,
    });

    const result = await loadTodayData(db, NOW);

    expect(result.accounts).toHaveLength(2);
    const spend = result.accounts.find((a) => a.id === "acc-spend");
    expect(spend?.balanceCents).toBe(123456);
    expect(result.netWorthCents).toBe(123456 + 1000000);
  });

  it("returns active upcoming bills ordered by next expected date; excludes non-active", async () => {
    const db = freshDb();
    db.insert(tables.recurringItems)
      .values({
        id: "bill-later",
        name: "Insurance",
        kind: "BILL",
        amountCents: 5000,
        frequency: "MONTHLY",
        status: "ACTIVE",
        nextExpectedDate: "2026-06-20",
        merchant: "Insurer",
        category: "Bills",
      })
      .run();
    db.insert(tables.recurringItems)
      .values({
        id: "bill-sooner",
        name: "Phone",
        kind: "BILL",
        amountCents: 3000,
        frequency: "MONTHLY",
        status: "ACTIVE",
        nextExpectedDate: "2026-06-16",
        merchant: "Telco",
        category: "Bills",
      })
      .run();
    db.insert(tables.recurringItems)
      .values({
        id: "bill-cancelled",
        name: "Old Gym",
        kind: "SUBSCRIPTION",
        amountCents: 4000,
        frequency: "MONTHLY",
        status: "CANCELLED",
        nextExpectedDate: "2026-06-17",
        merchant: "Gym",
        category: "Health",
      })
      .run();

    const result = await loadTodayData(db, NOW);

    expect(result.upcomingBills.map((b) => b.id)).toEqual(["bill-sooner", "bill-later"]);
    const first = result.upcomingBills[0];
    expect(first).toMatchObject({
      id: "bill-sooner",
      name: "Phone",
      amountCents: 3000,
      nextExpectedDate: "2026-06-16",
      merchant: "Telco",
      category: "Bills",
    });
  });

  it("returns insights as an empty placeholder array", async () => {
    const db = freshDb();
    const result = await loadTodayData(db, NOW);
    expect(result.insights).toEqual([]);
  });

  it("never leaks the encryption key or env name in the returned data", async () => {
    const db = freshDb();
    const result = await loadTodayData(db, NOW);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(KEY);
    expect(serialized).not.toContain("DB_ENCRYPTION_KEY");
  });
});
