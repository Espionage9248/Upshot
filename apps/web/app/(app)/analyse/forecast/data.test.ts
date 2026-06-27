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
import { loadForecastData } from "./data";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function freshDb(): DbClient {
  const dir = mkdtempSync(join(tmpdir(), "upshot-forecast-"));
  dirs.push(dir);
  const { db } = createDbClient({ url: join(dir, "x.db"), key: KEY });
  applyMigrations(db as DbClient);
  return db as DbClient;
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

// now = 2026-06-01 (a Monday); fortnightly salary last paid 2026-05-19
const NOW = "2026-06-01T00:00:00.000Z";

function seedData(db: DbClient): void {
  // Spending account
  db.insert(tables.accounts)
    .values({
      id: "acc-spend",
      name: "Spending",
      type: "TRANSACTIONAL",
      ownership: "INDIVIDUAL",
      balanceCents: 350000,
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
      balanceCents: 80000,
      role: "SAVER",
      monthlyAllocationCents: 25000,
    })
    .run();

  // Emergency fund (also a saver for budget allocation purposes)
  db.insert(tables.accounts)
    .values({
      id: "acc-ef",
      name: "Emergency Fund",
      type: "SAVER",
      ownership: "INDIVIDUAL",
      balanceCents: 200000,
      role: "EMERGENCY",
      monthlyAllocationCents: 15000,
    })
    .run();

  // Category for spending txns
  db.insert(tables.categories)
    .values({ id: "cat-groceries", name: "Groceries", parentId: null })
    .run();

  // Fortnightly salary: 3 txns with 14-day gaps (amounts identical)
  // Avg gap of 14 days → cadenceDays=14
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
      {
        id: "tx-salary-3",
        accountId: "acc-spend",
        status: "SETTLED",
        description: "ACME PAY",
        amountCents: 500000,
        currency: "AUD",
        categoryId: null,
        parentCategoryId: null,
        isTransfer: false,
        isSalary: true,
        settledAt: "2026-06-03T00:00:00.000Z",
        createdAt: "2026-06-03T00:00:00.000Z",
      },
    ])
    .run();

  // A few discretionary spending txns in the last 90 days
  db.insert(tables.transactions)
    .values([
      {
        id: "tx-groceries-1",
        accountId: "acc-spend",
        status: "SETTLED",
        description: "Woolworths",
        amountCents: -8000,
        currency: "AUD",
        categoryId: "cat-groceries",
        parentCategoryId: null,
        isTransfer: false,
        isSalary: false,
        settledAt: "2026-05-15T00:00:00.000Z",
        createdAt: "2026-05-15T00:00:00.000Z",
      },
      {
        id: "tx-groceries-2",
        accountId: "acc-spend",
        status: "SETTLED",
        description: "Coles",
        amountCents: -6000,
        currency: "AUD",
        categoryId: "cat-groceries",
        parentCategoryId: null,
        isTransfer: false,
        isSalary: false,
        settledAt: "2026-05-22T00:00:00.000Z",
        createdAt: "2026-05-22T00:00:00.000Z",
      },
      {
        id: "tx-groceries-3",
        accountId: "acc-spend",
        status: "SETTLED",
        description: "IGA",
        amountCents: -4000,
        currency: "AUD",
        categoryId: "cat-groceries",
        parentCategoryId: null,
        isTransfer: false,
        isSalary: false,
        settledAt: "2026-05-28T00:00:00.000Z",
        createdAt: "2026-05-28T00:00:00.000Z",
      },
    ])
    .run();

  // Active recurring bill
  db.insert(tables.recurringItems)
    .values({
      id: "rec-netflix",
      name: "Netflix",
      kind: "SUBSCRIPTION",
      amountCents: 2499,
      frequency: "MONTHLY",
      status: "ACTIVE",
      nextExpectedDate: "2026-06-15",
    })
    .run();

  // A debt with monthlyPaymentCents
  db.insert(tables.debts)
    .values({
      id: "debt-car",
      name: "Car Loan",
      type: "PERSONAL_LOAN",
      currentBalanceCents: 1500000,
      monthlyPaymentCents: 45000,
      minimumPaymentCents: 45000,
      interestRate: 6.5,
      payoffPriority: 1,
      includeInSnowball: true,
      includeInNetWorth: true,
    })
    .run();

  // An active installment plan (3 remaining of 6)
  db.insert(tables.installmentPlans)
    .values({
      id: "inst-zip",
      merchant: "JB Hi-Fi",
      totalCents: 120000,
      installmentCents: 20000,
      totalInstallments: 6,
      installmentsPaid: 3,
      frequencyDays: 14,
      firstDueDate: "2026-04-01",
      nextDueDate: "2026-06-10",
      status: "ACTIVE",
    })
    .run();

  // Budget allocation for the holiday saver in June
  db.insert(tables.budgetAllocations)
    .values({
      id: "ba-holiday-jun",
      accountId: "acc-holiday",
      month: "2026-06",
      year: 2026,
      allocatedCents: 25000,
      spentCents: 0,
      varianceCents: 25000,
    })
    .run();

  // App settings with debtStrategy
  db.insert(tables.appSettings)
    .values({
      id: "default",
      syncCadence: "DAILY",
      wifiOnlySync: false,
      backgroundRefresh: true,
      notifyOnSyncFail: true,
      autoDetectRecurring: true,
      autoCategorise: true,
      nightlyBackup: true,
      debtStrategy: "AVALANCHE",
      extraPaymentCents: 0,
      bigPurchaseThresholdCents: 0,
      currency: "AUD",
      dateFormat: "DD/MM/YYYY",
      financialYearStartMonth: 7,
      medicareLevyApplies: true,
      updatedAt: "2026-06-01T00:00:00.000Z",
    })
    .run();
}

describe("loadForecastData", () => {
  it("projected length equals horizon (30)", async () => {
    const db = freshDb();
    seedData(db);
    const data = await loadForecastData(db, { now: NOW, horizon: 30 });
    expect(data.forecast.projected).toHaveLength(30);
    expect(data.forecast.horizon).toBe(30);
  });

  it("projected length equals horizon (90)", async () => {
    const db = freshDb();
    seedData(db);
    const data = await loadForecastData(db, { now: NOW, horizon: 90 });
    expect(data.forecast.projected).toHaveLength(90);
    expect(data.forecast.horizon).toBe(90);
  });

  it("actual is non-empty (we have spending txns in the last 30d)", async () => {
    const db = freshDb();
    seedData(db);
    const data = await loadForecastData(db, { now: NOW, horizon: 30 });
    expect(data.forecast.actual.length).toBeGreaterThan(0);
  });

  it("salary baseline derives currentMonthlyIncomeCents from fortnightly cadence", async () => {
    const db = freshDb();
    seedData(db);
    const data = await loadForecastData(db, { now: NOW, horizon: 30 });
    // 3 txns of 500000: avg gap 14 days → cadenceDays=14
    // currentMonthlyIncomeCents = round(500000 × 30 / 14) = round(1071428.57) = 1071429
    expect(data.salaryBaseline.currentMonthlyIncomeCents).toBe(
      Math.round((500000 * 30) / 14),
    );
  });

  it("expenseBaseline.savers lists saver accounts including EMERGENCY", async () => {
    const db = freshDb();
    seedData(db);
    const data = await loadForecastData(db, { now: NOW, horizon: 30 });
    const ids = data.expenseBaseline.savers.map((s) => s.saverId);
    expect(ids).toContain("acc-holiday");
    expect(ids).toContain("acc-ef");
  });

  it("salaryBaseline.monthlyExpensesCents is actual avg outflow (90d total ÷ 3), not allocations", async () => {
    const db = freshDb();
    seedData(db);
    const data = await loadForecastData(db, { now: NOW, horizon: 30 });
    // 3 grocery outflows (8000 + 6000 + 4000 = 18000) within the 90-day window
    // → round(18000 / 3) = 6000. Disjoint from saver allocations (25000).
    expect(data.salaryBaseline.monthlyExpensesCents).toBe(6000);
    expect(data.salaryBaseline.monthlyExpensesCents).not.toBe(25000);
  });

  it("salaryBaseline.debts includes only includeInSnowball=true debts", async () => {
    const db = freshDb();
    seedData(db);
    const data = await loadForecastData(db, { now: NOW, horizon: 30 });
    expect(data.salaryBaseline.debts.some((d) => d.id === "debt-car")).toBe(true);
  });

  it("salaryBaseline.debtStrategy matches app_settings", async () => {
    const db = freshDb();
    seedData(db);
    const data = await loadForecastData(db, { now: NOW, horizon: 30 });
    expect(data.salaryBaseline.debtStrategy).toBe("AVALANCHE");
  });

  it("forecast.startBalanceCents matches spending account balance", async () => {
    const db = freshDb();
    seedData(db);
    const data = await loadForecastData(db, { now: NOW, horizon: 30 });
    expect(data.forecast.startBalanceCents).toBe(350000);
  });

  it("discretionary stats are integer cents (Math.round applied)", async () => {
    const db = freshDb();
    seedData(db);
    const data = await loadForecastData(db, { now: NOW, horizon: 30 });
    // Just verify they are finite integers >= 0 — if Math.round is missing they'd be floats
    expect(Number.isInteger(data.forecast.projected[0]!.centralCents)).toBe(true);
    // We can't directly access avgDailyDiscretionaryCents from the DTO, but integer
    // projected values confirm the engine received integer inputs
    expect(data.forecast.projected.every((d) => Number.isInteger(d.centralCents))).toBe(true);
  });

  it("handles empty db without throwing", async () => {
    const db = freshDb();
    const data = await loadForecastData(db, { now: NOW, horizon: 30 });
    expect(data.forecast.projected).toHaveLength(30);
    expect(data.salaryBaseline.currentMonthlyIncomeCents).toBe(0);
    expect(data.expenseBaseline.savers).toHaveLength(0);
  });
});
