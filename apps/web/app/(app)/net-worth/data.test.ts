import { afterEach, describe, it, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createDbClient,
  applyMigrations,
  seed,
  DrizzleAccountRepo,
  DrizzleAssetRepo,
  tables,
  type DbClient,
} from "@upshot/db";
import { loadNetWorthData } from "./data";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function freshDb(): DbClient {
  const dir = mkdtempSync(join(tmpdir(), "upshot-networth-"));
  dirs.push(dir);
  const { db } = createDbClient({ url: join(dir, "x.db"), key: KEY });
  applyMigrations(db as DbClient);
  seed(db as DbClient);
  return db as DbClient;
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

describe("loadNetWorthData", () => {
  it("returns totalCents = accounts + assets − debts (computeNetWorth)", async () => {
    const db = freshDb();
    const accountRepo = new DrizzleAccountRepo(db);
    await accountRepo.upsert({
      id: "acc-a",
      name: "Spending",
      type: "TRANSACTIONAL",
      ownership: "INDIVIDUAL",
      balanceCents: 123456,
      role: "SPENDING",
      monthlyAllocationCents: 0,
      lastSyncedAt: null,
    });
    const assetRepo = new DrizzleAssetRepo(db);
    await assetRepo.create({
      name: "Test Property",
      type: "PROPERTY",
      valueCents: 50000,
      includeInNetWorth: true,
      institution: null,
      notes: null,
    });
    db.insert(tables.debts)
      .values({
        id: "debt-1",
        name: "Car Loan",
        type: "CAR",
        currentBalanceCents: 20000,
        monthlyPaymentCents: 500,
        includeInNetWorth: true,
      })
      .run();

    const result = await loadNetWorthData(db);

    expect(result.totalCents).toBe(123456 + 50000 - 20000);
  });

  it("returns the asset rows for the table", async () => {
    const db = freshDb();
    const assetRepo = new DrizzleAssetRepo(db);
    await assetRepo.create({
      name: "Super Fund",
      type: "SUPER",
      valueCents: 2820000,
      includeInNetWorth: true,
      institution: "AustralianSuper",
      notes: null,
    });

    const result = await loadNetWorthData(db);

    expect(result.assets).toHaveLength(1);
    expect(result.assets[0]).toMatchObject({
      name: "Super Fund",
      type: "SUPER",
      valueCents: 2820000,
      institution: "AustralianSuper",
      includeInNetWorth: true,
    });
  });

  it("prefers monthly_snapshots for the trend (assets/debts/net per month)", async () => {
    const db = freshDb();
    db.insert(tables.monthlySnapshots)
      .values([
        {
          id: "snap-apr",
          month: "2026-04",
          incomeCents: 0,
          expenseCents: 0,
          savedCents: 0,
          debtCents: 800000,
          assetsCents: 5300000,
          netWorthCents: 4500000,
        },
        {
          id: "snap-may",
          month: "2026-05",
          incomeCents: 0,
          expenseCents: 0,
          savedCents: 0,
          debtCents: 824000,
          assetsCents: 5500000,
          netWorthCents: 4676000,
        },
      ])
      .run();

    const result = await loadNetWorthData(db);

    expect(result.trend).toHaveLength(2);
    expect(result.trend[0]).toMatchObject({
      assetsCents: 5300000,
      debtsCents: 800000,
      netCents: 4500000,
    });
    expect(result.trend[1]!.netCents).toBe(4676000);
  });

  it("falls back to asset valuations when no snapshots exist", async () => {
    const db = freshDb();
    const assetRepo = new DrizzleAssetRepo(db);
    const id = await assetRepo.create({
      name: "Shares",
      type: "INVESTMENT",
      valueCents: 900000,
      includeInNetWorth: true,
      institution: null,
      notes: null,
    });
    await assetRepo.recordValuation(id, 950000, "2026-04-01T00:00:00.000Z");
    await assetRepo.recordValuation(id, 980000, "2026-05-01T00:00:00.000Z");

    const result = await loadNetWorthData(db);

    expect(result.trend.length).toBeGreaterThanOrEqual(2);
    // Ordered ascending by valuedAt; assets carry the valuation, debts unknown → 0.
    expect(result.trend[0]!.assetsCents).toBe(950000);
    expect(result.trend[0]!.netCents).toBe(950000);
    expect(result.trend[result.trend.length - 1]!.assetsCents).toBe(980000);
  });

  it("returns an empty trend when there are no valuations", async () => {
    const db = freshDb();
    const result = await loadNetWorthData(db);
    expect(result.trend).toEqual([]);
  });

  it("never leaks the encryption key in the returned data", async () => {
    const db = freshDb();
    const result = await loadNetWorthData(db);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(KEY);
  });
});
