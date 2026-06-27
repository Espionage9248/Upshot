import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createDbClient,
  applyMigrations,
  tables,
  type DbClient,
} from "@upshot/db";
import { recomputeSalaryChange, recomputeExpenseChange } from "./forecast-core";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

// now = 2026-06-01; fortnightly salary so currentMonthlyIncomeCents > 0.
const NOW = "2026-06-01T00:00:00.000Z";

function freshDb(): DbClient {
  const dir = mkdtempSync(join(tmpdir(), "upshot-forecast-core-"));
  dirs.push(dir);
  const { db } = createDbClient({ url: join(dir, "x.db"), key: KEY });
  applyMigrations(db as DbClient);
  return db as DbClient;
}

/**
 * Minimal baseline: a spending account, two saver accounts (with monthly
 * allocations), and two fortnightly salary txns → a known current income.
 */
function seed(db: DbClient): void {
  db.insert(tables.accounts)
    .values([
      {
        id: "acc-spend",
        name: "Spending",
        type: "TRANSACTIONAL",
        ownership: "INDIVIDUAL",
        balanceCents: 350000,
        role: "SPENDING",
        monthlyAllocationCents: 0,
      },
      {
        id: "acc-holiday",
        name: "Holiday",
        type: "SAVER",
        ownership: "INDIVIDUAL",
        balanceCents: 80000,
        role: "SAVER",
        monthlyAllocationCents: 25000,
      },
      {
        id: "acc-ef",
        name: "Emergency Fund",
        type: "SAVER",
        ownership: "INDIVIDUAL",
        balanceCents: 200000,
        role: "EMERGENCY",
        monthlyAllocationCents: 15000,
      },
    ])
    .run();

  // Two fortnightly salary txns (14-day gap) → cadenceDays=14, monthly ≈ amount*30/14.
  db.insert(tables.transactions)
    .values([
      {
        id: "tx-salary-1",
        accountId: "acc-spend",
        status: "SETTLED",
        description: "ACME PAY",
        amountCents: 500000,
        currency: "AUD",
        categoryId: null,
        parentCategoryId: null,
        isTransfer: false,
        isSalary: true,
        settledAt: "2026-05-06T00:00:00.000Z",
        createdAt: "2026-05-06T00:00:00.000Z",
      },
      {
        id: "tx-salary-2",
        accountId: "acc-spend",
        status: "SETTLED",
        description: "ACME PAY",
        amountCents: 500000,
        currency: "AUD",
        categoryId: null,
        parentCategoryId: null,
        isTransfer: false,
        isSalary: true,
        settledAt: "2026-05-20T00:00:00.000Z",
        createdAt: "2026-05-20T00:00:00.000Z",
      },
    ])
    .run();
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

describe("recomputeSalaryChange", () => {
  it("flows the user's new income through to a positive incomeChangeCents", async () => {
    const db = freshDb();
    seed(db);

    const baseline = await recomputeSalaryChange(db, NOW, {
      newMonthlyIncomeCents: 0,
    });
    const current = baseline.currentIncomeCents;
    expect(current).toBeGreaterThan(0);

    const raised = await recomputeSalaryChange(db, NOW, {
      newMonthlyIncomeCents: current + 100000,
    });
    expect(raised.currentIncomeCents).toBe(current);
    expect(raised.newIncomeCents).toBe(current + 100000);
    expect(raised.incomeChangeCents).toBe(100000);
    expect(raised.incomeChangePct).toBeGreaterThan(0);
  });
});

describe("recomputeExpenseChange", () => {
  it("reflects a saver allocation adjustment in the new total allocated", async () => {
    const db = freshDb();
    seed(db);

    // Baseline total allocation = 25000 + 15000 = 40000.
    const baseline = await recomputeExpenseChange(db, NOW, { adjustments: [] });
    expect(baseline.currentTotalAllocatedCents).toBe(40000);
    expect(baseline.newTotalAllocatedCents).toBe(40000);

    // Cut the Holiday saver from 25000 → 10000.
    const adjusted = await recomputeExpenseChange(db, NOW, {
      adjustments: [{ saverId: "acc-holiday", newAllocationCents: 10000 }],
    });
    expect(adjusted.currentTotalAllocatedCents).toBe(40000);
    expect(adjusted.newTotalAllocatedCents).toBe(25000);
    expect(adjusted.allocationChangeCents).toBe(-15000);
    // Reduced allocation = freed savings.
    expect(adjusted.monthlyImpactCents).toBe(15000);
    expect(adjusted.yearlyImpactCents).toBe(180000);
  });
});
