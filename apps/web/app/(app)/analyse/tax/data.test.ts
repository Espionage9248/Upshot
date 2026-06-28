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
import { loadTaxData } from "./data";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function freshDb(): DbClient {
  const dir = mkdtempSync(join(tmpdir(), "upshot-tax-"));
  dirs.push(dir);
  const { db } = createDbClient({ url: join(dir, "x.db"), key: KEY });
  applyMigrations(db as DbClient);
  return db as DbClient;
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

// now = 2026-06-28; FY start month = 7 → ending year = 2026
// FY window: 2025-07-01 … 2026-06-30
const NOW = "2026-06-28T00:00:00.000Z";

function seedSettings(db: DbClient, overrides: Partial<{
  taxableIncomeGrossCents: number;
  paygWithheldCents: number;
  financialYearStartMonth: number;
  medicareLevyApplies: boolean;
}> = {}): void {
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
      financialYearStartMonth: overrides.financialYearStartMonth ?? 7,
      medicareLevyApplies: overrides.medicareLevyApplies ?? true,
      taxableIncomeGrossCents: overrides.taxableIncomeGrossCents ?? 0,
      paygWithheldCents: overrides.paygWithheldCents ?? 0,
      updatedAt: NOW,
    })
    .run();
}

function seedAccount(db: DbClient): void {
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
}

function seedCategories(db: DbClient): void {
  db.insert(tables.categories)
    .values([
      { id: "cat-home-office", name: "Home Office", parentId: null },
      { id: "cat-professional", name: "Professional Development", parentId: null },
    ])
    .run();
}

/**
 * Seed transactions for deductible aggregation tests:
 *   - tx-ded-1: $150 home office (in FY, deductible, taxDeductionCategory set)
 *   - tx-ded-2: $80 professional development (in FY, deductible, no taxDeductionCategory → falls back to cat name)
 *   - tx-ded-outside: $200 deductible but OUTSIDE the FY window (2024-06-30, excluded)
 *   - tx-non-ded: $500 NOT deductible (excluded)
 */
function seedTransactions(db: DbClient): void {
  db.insert(tables.transactions)
    .values([
      // In-FY deductible with explicit taxDeductionCategory
      {
        id: "tx-ded-1",
        accountId: "acc-spend",
        status: "SETTLED",
        description: "Officeworks",
        amountCents: -15000, // $150
        currency: "AUD",
        categoryId: "cat-home-office",
        parentCategoryId: null,
        isTransfer: false,
        isSalary: false,
        isTaxDeductible: true,
        taxDeductionCategory: "Home Office",
        settledAt: "2026-01-10T00:00:00.000Z",
        createdAt: "2026-01-10T00:00:00.000Z",
      },
      // In-FY deductible, no taxDeductionCategory → uses category name
      {
        id: "tx-ded-2",
        accountId: "acc-spend",
        status: "SETTLED",
        description: "Udemy Course",
        amountCents: -8000, // $80
        currency: "AUD",
        categoryId: "cat-professional",
        parentCategoryId: null,
        isTransfer: false,
        isSalary: false,
        isTaxDeductible: true,
        taxDeductionCategory: null,
        settledAt: "2026-03-15T00:00:00.000Z",
        createdAt: "2026-03-15T00:00:00.000Z",
      },
      // Outside FY window (FY ends 30 Jun 2026; this is in previous FY)
      {
        id: "tx-ded-outside",
        accountId: "acc-spend",
        status: "SETTLED",
        description: "Old Deductible",
        amountCents: -20000, // $200
        currency: "AUD",
        categoryId: null,
        parentCategoryId: null,
        isTransfer: false,
        isSalary: false,
        isTaxDeductible: true,
        taxDeductionCategory: "Other",
        settledAt: "2024-06-30T00:00:00.000Z",
        createdAt: "2024-06-30T00:00:00.000Z",
      },
      // Non-deductible (excluded)
      {
        id: "tx-non-ded",
        accountId: "acc-spend",
        status: "SETTLED",
        description: "Groceries",
        amountCents: -50000, // $500
        currency: "AUD",
        categoryId: null,
        parentCategoryId: null,
        isTransfer: false,
        isSalary: false,
        isTaxDeductible: false,
        taxDeductionCategory: null,
        settledAt: "2026-04-01T00:00:00.000Z",
        createdAt: "2026-04-01T00:00:00.000Z",
      },
    ])
    .run();
}

describe("loadTaxData", () => {
  it("aggregates settled deductible txns within the FY by deduction category", async () => {
    const db = freshDb();
    seedAccount(db);
    seedCategories(db);
    seedTransactions(db);
    seedSettings(db, {
      taxableIncomeGrossCents: 10_000_000, // $100k
      paygWithheldCents: 2_500_000,
    });

    const data = await loadTaxData(db, { now: NOW });

    // Only the 2 in-window deductibles: $150 + $80 = $230 → 23000 cents
    expect(data.estimate.totalDeductibleCents).toBe(23000);
    expect(data.estimate.byCategory.length).toBe(2);
    const labels = data.estimate.byCategory.map((g) => g.category);
    expect(labels).toContain("Home Office");
    // tx-ded-2 has no taxDeductionCategory → falls back to category name
    expect(labels).toContain("Professional Development");
  });

  it("uses fyLabel for the FY ending year (FY2025-26 for now=2026-06-28)", async () => {
    const db = freshDb();
    const data = await loadTaxData(db, { now: NOW });
    expect(data.fyLabel).toBe("FY2025-26");
  });

  it("reports hasIncomeInputs=false when gross & withheld are unset", async () => {
    const db = freshDb();
    const data = await loadTaxData(db, { now: NOW });
    expect(data.hasIncomeInputs).toBe(false);
  });

  it("reports hasIncomeInputs=true when gross income is set", async () => {
    const db = freshDb();
    seedSettings(db, { taxableIncomeGrossCents: 8_000_000 });
    const data = await loadTaxData(db, { now: NOW });
    expect(data.hasIncomeInputs).toBe(true);
  });

  it("daysToEofy is non-negative and close to end of FY", async () => {
    const db = freshDb();
    // now = 2026-06-28, EOFY = 2026-06-30T23:59:59.999Z → ~2 days
    const data = await loadTaxData(db, { now: NOW });
    expect(data.daysToEofy).toBeGreaterThanOrEqual(2);
    expect(data.daysToEofy).toBeLessThanOrEqual(4);
  });

  it("excludes non-deductible txns from totalDeductibleCents", async () => {
    const db = freshDb();
    seedAccount(db);
    seedCategories(db);
    seedTransactions(db);

    const data = await loadTaxData(db, { now: NOW });
    // $500 non-deductible txn must NOT be included
    expect(data.estimate.totalDeductibleCents).toBe(23000);
  });

  it("excludes deductible txns outside the FY window", async () => {
    const db = freshDb();
    seedAccount(db);
    seedCategories(db);
    seedTransactions(db);

    const data = await loadTaxData(db, { now: NOW });
    // $200 outside-FY txn must NOT be included
    const outsideLabel = data.estimate.byCategory.find((g) => g.category === "Other");
    expect(outsideLabel).toBeUndefined();
  });

  it("handles empty db without throwing", async () => {
    const db = freshDb();
    const data = await loadTaxData(db, { now: NOW });
    expect(data.estimate.totalDeductibleCents).toBe(0);
    expect(data.estimate.byCategory).toHaveLength(0);
    expect(data.hasIncomeInputs).toBe(false);
    expect(data.fyLabel).toBe("FY2025-26");
  });
});
