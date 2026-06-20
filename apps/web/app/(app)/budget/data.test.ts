import { afterEach, describe, it, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createDbClient,
  applyMigrations,
  DrizzleAccountRepo,
  tables,
  type DbClient,
} from "@upshot/db";
import { loadBudgetData } from "./data";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function freshDb(): DbClient {
  const dir = mkdtempSync(join(tmpdir(), "upshot-budget-"));
  dirs.push(dir);
  const { db } = createDbClient({ url: join(dir, "x.db"), key: KEY });
  applyMigrations(db as DbClient);
  return db as DbClient;
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

const NOW = new Date("2026-06-13T10:00:00.000Z");

async function seedAccounts(db: DbClient) {
  const repo = new DrizzleAccountRepo(db);
  await repo.upsert({
    id: "acc-spend",
    name: "Spending",
    type: "TRANSACTIONAL",
    ownership: "INDIVIDUAL",
    balanceCents: 50000,
    role: "SPENDING",
    monthlyAllocationCents: 0,
    lastSyncedAt: null,
  });
  await repo.upsert({
    id: "acc-groceries",
    name: "Groceries",
    type: "SAVER",
    ownership: "INDIVIDUAL",
    balanceCents: 18600,
    role: "SAVER",
    monthlyAllocationCents: 60000,
    lastSyncedAt: null,
  });
  await repo.upsert({
    id: "acc-emergency",
    name: "Emergency Fund",
    type: "SAVER",
    ownership: "INDIVIDUAL",
    balanceCents: 450000,
    role: "EMERGENCY",
    monthlyAllocationCents: 25000,
    lastSyncedAt: null,
  });
}

function insertTx(
  db: DbClient,
  row: {
    id: string;
    accountId: string;
    amountCents: number;
    createdAt: string;
    isTransfer?: boolean;
    transferAccountId?: string | null;
  },
) {
  db.insert(tables.transactions)
    .values({
      id: row.id,
      accountId: row.accountId,
      status: "SETTLED",
      description: row.id,
      amountCents: row.amountCents,
      isTransfer: row.isTransfer ?? false,
      transferAccountId: row.transferAccountId ?? null,
      createdAt: row.createdAt,
    })
    .run();
}

describe("loadBudgetData", () => {
  it("returns one saver analysis per saver account (excludes the emergency + spending accounts)", async () => {
    const db = freshDb();
    await seedAccounts(db);

    const result = await loadBudgetData(db, NOW);

    expect(result.savers.map((s) => s.analysis.saverId)).toEqual(["acc-groceries"]);
    const groceries = result.savers[0]!.analysis;
    expect(groceries.saverName).toBe("Groceries");
    expect(groceries.currentBalance).toBe(18600);
  });

  it("computes monthly spending for the current month from the saver's own outflows", async () => {
    const db = freshDb();
    await seedAccounts(db);
    // current-month spend (June 2026)
    insertTx(db, { id: "t1", accountId: "acc-groceries", amountCents: -12000, createdAt: "2026-06-05T00:00:00.000Z" });
    insertTx(db, { id: "t2", accountId: "acc-groceries", amountCents: -3000, createdAt: "2026-06-10T00:00:00.000Z" });

    const result = await loadBudgetData(db, NOW);

    expect(result.savers[0]!.analysis.monthlySpending).toBe(15000);
  });

  it("EXCLUDES future-dated current-month transfers/outflows from the analysis window (carry-forward 1)", async () => {
    const db = freshDb();
    await seedAccounts(db);
    insertTx(db, { id: "past", accountId: "acc-groceries", amountCents: -5000, createdAt: "2026-06-05T00:00:00.000Z" });
    // A future-dated row in the same month must NOT count.
    insertTx(db, { id: "future", accountId: "acc-groceries", amountCents: -9999, createdAt: "2026-06-28T00:00:00.000Z" });

    const result = await loadBudgetData(db, NOW);

    expect(result.savers[0]!.analysis.monthlySpending).toBe(5000);
  });

  it("returns an emergency-fund analysis with positive monthly-expense-derived target", async () => {
    const db = freshDb();
    await seedAccounts(db);
    // Spending-account expense outflows across prior complete months (positive
    // target requires the loader to Math.abs() these — carry-forward 2).
    insertTx(db, { id: "e1", accountId: "acc-spend", amountCents: -300000, createdAt: "2026-05-10T00:00:00.000Z" });
    insertTx(db, { id: "e2", accountId: "acc-spend", amountCents: -300000, createdAt: "2026-04-10T00:00:00.000Z" });

    const result = await loadBudgetData(db, NOW);

    expect(result.emergencyFund).not.toBeNull();
    expect(result.emergencyFund!.accountId).toBe("acc-emergency");
    expect(result.emergencyFund!.currentBalance).toBe(450000);
    // 2 months × $3000 expenses over a /6 window → avg $1000/mo → target 6×$1000 = $6000.
    expect(result.emergencyFund!.targetBalance).toBe(600000);
    expect(result.emergencyFund!.targetBalance).toBeGreaterThan(0);
  });

  it("returns null emergency-fund analysis when no EMERGENCY account exists", async () => {
    const db = freshDb();
    const repo = new DrizzleAccountRepo(db);
    await repo.upsert({
      id: "acc-only-saver",
      name: "Holiday",
      type: "SAVER",
      ownership: "INDIVIDUAL",
      balanceCents: 1000,
      role: "SAVER",
      monthlyAllocationCents: 5000,
      lastSyncedAt: null,
    });

    const result = await loadBudgetData(db, NOW);
    expect(result.emergencyFund).toBeNull();
  });

  it("attaches a deterministic goal-confidence result to each saver with an allocation", async () => {
    const db = freshDb();
    await seedAccounts(db);

    const a = await loadBudgetData(db, NOW);
    const b = await loadBudgetData(db, NOW);

    const conf = a.savers[0]!.confidence;
    expect(conf).not.toBeNull();
    expect(conf!.confidence).toBeGreaterThanOrEqual(0);
    expect(conf!.confidence).toBeLessThanOrEqual(1);
    expect(["low", "medium", "high"]).toContain(conf!.band);
    // Deterministic: same seeded input → identical confidence.
    expect(b.savers[0]!.confidence).toEqual(conf);
  });

  it("has no goal-confidence for a saver with a zero allocation", async () => {
    const db = freshDb();
    const repo = new DrizzleAccountRepo(db);
    await repo.upsert({
      id: "acc-no-alloc",
      name: "Spare",
      type: "SAVER",
      ownership: "INDIVIDUAL",
      balanceCents: 2000,
      role: "SAVER",
      monthlyAllocationCents: 0,
      lastSyncedAt: null,
    });

    const result = await loadBudgetData(db, NOW);
    expect(result.savers[0]!.confidence).toBeNull();
    expect(result.savers[0]!.goal).toBeNull();
  });

  it("uses the real goal (independent of the allocation gate) and surfaces it on the saver", async () => {
    const db = freshDb();
    const repo = new DrizzleAccountRepo(db);
    await repo.upsert({
      id: "acc-holiday",
      name: "Holiday",
      type: "SAVER",
      ownership: "INDIVIDUAL",
      balanceCents: 100000,
      role: "SAVER",
      monthlyAllocationCents: 0, // no allocation → heuristic gate would skip this saver
      lastSyncedAt: null,
    });
    // A real user-entered goal: $5,000 by 2027-01-01.
    await repo.setGoal("acc-holiday", 500000, "2027-01-01");

    const result = await loadBudgetData(db, NOW);

    // Without A4 this would be null — the heuristic requires monthlyAllocationCents > 0.
    expect(result.savers[0]!.confidence).not.toBeNull();
    expect(result.savers[0]!.goal).toEqual({ targetCents: 500000, targetDate: "2027-01-01" });
  });

  it("keeps the heuristic (and a null goal) for a saver with an allocation but no goal", async () => {
    const db = freshDb();
    await seedAccounts(db); // acc-groceries has monthlyAllocationCents 60000 and no goal

    const result = await loadBudgetData(db, NOW);

    expect(result.savers[0]!.confidence).not.toBeNull();
    expect(result.savers[0]!.goal).toBeNull();
  });

  it("never leaks the encryption key in the returned data", async () => {
    const db = freshDb();
    await seedAccounts(db);
    const result = await loadBudgetData(db, NOW);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(KEY);
    expect(serialized).not.toContain("DB_ENCRYPTION_KEY");
  });
});
