import { afterEach, describe, it, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createDbClient,
  applyMigrations,
  tables,
  type DbClient,
} from "@upshot/db";
import { loadAnalyticsData } from "./data";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function freshDb(): DbClient {
  const dir = mkdtempSync(join(tmpdir(), "upshot-analytics-"));
  dirs.push(dir);
  const { db } = createDbClient({ url: join(dir, "x.db"), key: KEY });
  applyMigrations(db as DbClient);
  return db as DbClient;
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

/**
 * Seed one full salary period for analytics testing.
 * Includes: salary, expenses, saver account, emergency fund, tags.
 */
function seedData(db: DbClient): void {
  // Spending account
  db.insert(tables.accounts)
    .values({
      id: "acc-spend",
      name: "Spending",
      type: "TRANSACTIONAL",
      ownership: "INDIVIDUAL",
      balanceCents: 500000,
      role: "SPENDING",
      monthlyAllocationCents: 0,
    })
    .run();

  // Saver account
  db.insert(tables.accounts)
    .values({
      id: "acc-holiday",
      name: "Holiday",
      type: "SAVER",
      ownership: "INDIVIDUAL",
      balanceCents: 100000,
      role: "SAVER",
      monthlyAllocationCents: 30000,
    })
    .run();

  // Emergency fund account
  db.insert(tables.accounts)
    .values({
      id: "acc-ef",
      name: "Emergency Fund",
      type: "SAVER",
      ownership: "INDIVIDUAL",
      balanceCents: 300000,
      role: "EMERGENCY",
      monthlyAllocationCents: 25000,
    })
    .run();

  db.insert(tables.categories)
    .values([
      { id: "cat-groceries", name: "Groceries", parentId: null },
      { id: "cat-transport", name: "Transport", parentId: null },
    ])
    .run();

  // Salary deposit (period anchor in May 2026)
  db.insert(tables.transactions)
    .values({
      id: "tx-salary",
      accountId: "acc-spend",
      status: "SETTLED",
      description: "ACME PAY",
      amountCents: 600000,
      currency: "AUD",
      categoryId: null,
      parentCategoryId: null,
      isTransfer: false,
      isSalary: true,
      settledAt: "2026-05-01T00:00:00.000Z",
      createdAt: "2026-05-01T00:00:00.000Z",
    })
    .run();

  // Expenses in May 2026
  db.insert(tables.transactions)
    .values([
      {
        id: "tx-groceries",
        accountId: "acc-spend",
        status: "SETTLED",
        description: "Woolworths",
        amountCents: -8000,
        currency: "AUD",
        categoryId: "cat-groceries",
        parentCategoryId: null,
        isTransfer: false,
        isSalary: false,
        settledAt: "2026-05-05T00:00:00.000Z",
        createdAt: "2026-05-05T00:00:00.000Z",
      },
      {
        id: "tx-transport",
        accountId: "acc-spend",
        status: "SETTLED",
        description: "Opal",
        amountCents: -2000,
        currency: "AUD",
        categoryId: "cat-transport",
        parentCategoryId: null,
        isTransfer: false,
        isSalary: false,
        settledAt: "2026-05-10T00:00:00.000Z",
        createdAt: "2026-05-10T00:00:00.000Z",
      },
    ])
    .run();

  // Tag the groceries transaction
  db.insert(tables.tags).values({ id: "essentials" }).run();
  db.insert(tables.transactionTags)
    .values({ transactionId: "tx-groceries", tagId: "essentials" })
    .run();

  // Budget allocation for Holiday saver
  db.insert(tables.budgetAllocations)
    .values({
      id: "ba-holiday-may",
      accountId: "acc-holiday",
      month: "2026-05",
      year: 2026,
      allocatedCents: 30000,
      spentCents: 0,
      varianceCents: 30000,
    })
    .run();
}

const NOW = "2026-05-31T00:00:00.000Z";

describe("loadAnalyticsData", () => {
  it("returns a BudgetHealthScore with a 0-100 score and grade", async () => {
    const db = freshDb();
    seedData(db);

    const result = await loadAnalyticsData(db, { now: NOW });

    expect(result.health.score).toBeGreaterThanOrEqual(0);
    expect(result.health.score).toBeLessThanOrEqual(100);
    expect(["excellent", "good", "fair", "poor"]).toContain(result.health.grade);
    expect(result.health.factors.length).toBeGreaterThan(0);
  });

  it("returns a heatmap array with date + spendCents + intensity fields", async () => {
    const db = freshDb();
    seedData(db);

    const result = await loadAnalyticsData(db, { now: NOW });

    expect(Array.isArray(result.heatmap)).toBe(true);
    expect(result.heatmap.length).toBeGreaterThan(0);
    const day = result.heatmap[0]!;
    expect(typeof day.date).toBe("string");
    expect(typeof day.spendCents).toBe("number");
    expect(typeof day.intensity).toBe("number");
    expect(typeof day.isZero).toBe("boolean");
  });

  it("returns a NoSpendStreak with currentDays and bestDays", async () => {
    const db = freshDb();
    seedData(db);

    const result = await loadAnalyticsData(db, { now: NOW });

    expect(typeof result.streak.currentDays).toBe("number");
    expect(typeof result.streak.bestDays).toBe("number");
    expect(result.streak.currentDays).toBeGreaterThanOrEqual(0);
    expect(result.streak.bestDays).toBeGreaterThanOrEqual(0);
  });

  it("returns saver alignment array (envelopeAlignment)", async () => {
    const db = freshDb();
    seedData(db);

    const result = await loadAnalyticsData(db, { now: NOW });

    expect(Array.isArray(result.envelopeAlignment)).toBe(true);
    const holiday = result.envelopeAlignment.find((s) => s.saverId === "acc-holiday");
    expect(holiday).toBeDefined();
    // variancePercentage is a number
    expect(typeof holiday!.variancePercentage).toBe("number");
  });

  it("returns EF readiness (emergencyFund) with readinessScore 0-100", async () => {
    const db = freshDb();
    seedData(db);

    const result = await loadAnalyticsData(db, { now: NOW });

    expect(result.emergencyFund).not.toBeNull();
    expect(result.emergencyFund!.readinessScore).toBeGreaterThanOrEqual(0);
    expect(result.emergencyFund!.readinessScore).toBeLessThanOrEqual(100);
  });

  it("returns behaviouralInsights and spendingInsights arrays", async () => {
    const db = freshDb();
    seedData(db);

    const result = await loadAnalyticsData(db, { now: NOW });

    expect(Array.isArray(result.behaviouralInsights)).toBe(true);
    expect(Array.isArray(result.spendingInsights)).toBe(true);
  });

  it("returns tagSummary array (may be empty when few tags exist)", async () => {
    const db = freshDb();
    seedData(db);

    const result = await loadAnalyticsData(db, { now: NOW });

    expect(Array.isArray(result.tagSummary)).toBe(true);
    // We seeded 1 tag on groceries, so there should be 1 entry
    expect(result.tagSummary.length).toBe(1);
    expect(result.tagSummary[0]!.tag).toBe("essentials");
  });

  it("never leaks the encryption key in the returned data", async () => {
    const db = freshDb();
    seedData(db);

    const result = await loadAnalyticsData(db, { now: NOW });
    expect(JSON.stringify(result)).not.toContain(KEY);
  });

  it("handles empty db (no transactions) without throwing", async () => {
    const db = freshDb();
    const result = await loadAnalyticsData(db, { now: NOW });

    expect(result.health.score).toBeGreaterThanOrEqual(0);
    expect(result.heatmap.length).toBeGreaterThan(0);
    expect(result.streak.currentDays).toBeGreaterThanOrEqual(0);
    expect(result.envelopeAlignment).toHaveLength(0);
    expect(result.emergencyFund).toBeNull();
    expect(result.tagSummary).toHaveLength(0);
  });
});
