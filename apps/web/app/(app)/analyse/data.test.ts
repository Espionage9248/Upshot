import { afterEach, describe, it, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createDbClient,
  applyMigrations,
  seed,
  DrizzleCategoryRepo,
  tables,
  type DbClient,
} from "@upshot/db";
import { loadReportsData } from "./data";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function freshDb(): DbClient {
  const dir = mkdtempSync(join(tmpdir(), "upshot-analyse-"));
  dirs.push(dir);
  const { db } = createDbClient({ url: join(dir, "x.db"), key: KEY });
  applyMigrations(db as DbClient);
  seed(db as DbClient);
  return db as DbClient;
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

/**
 * Seed one full salary period: a salary deposit on 1 May, two expenses
 * (groceries + transport) inside the period, a saver account with an
 * allocation + an outflow, and a debt with one in-period payment.
 */
function seedPeriod(db: DbClient): void {
  // A spending account to hang transactions off.
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

  // A saver account → drives envelope performance.
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

  db.insert(tables.categories)
    .values([
      { id: "cat-groceries", name: "Groceries", parentId: null },
      { id: "cat-transport", name: "Transport", parentId: null },
    ])
    .run();

  // Salary deposit (period anchor).
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

  // Two in-period expenses.
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
      // A saver outflow (spend from the Holiday envelope) inside the period.
      {
        id: "tx-saver-spend",
        accountId: "acc-holiday",
        status: "SETTLED",
        description: "Flights",
        amountCents: -15000,
        currency: "AUD",
        categoryId: null,
        parentCategoryId: null,
        isTransfer: false,
        isSalary: false,
        settledAt: "2026-05-08T00:00:00.000Z",
        createdAt: "2026-05-08T00:00:00.000Z",
      },
    ])
    .run();

  // A tag on the groceries transaction (tag id == tag value).
  db.insert(tables.tags).values({ id: "essentials" }).run();
  db.insert(tables.transactionTags)
    .values({ transactionId: "tx-groceries", tagId: "essentials" })
    .run();

  // A saver allocation row for the period's month (authoritative envelope budget).
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

  // A debt + one in-period payment.
  db.insert(tables.debts)
    .values({
      id: "debt-card",
      name: "Visa",
      type: "CREDIT_CARD",
      currentBalanceCents: 200000,
      monthlyPaymentCents: 50000,
    })
    .run();
  db.insert(tables.debtPayments)
    .values({
      id: "dp-1",
      debtId: "debt-card",
      transactionId: null,
      amountCents: 50000,
      paymentDate: "2026-05-12T00:00:00.000Z",
    })
    .run();
}

const NOW = "2026-05-31T00:00:00.000Z";

describe("loadReportsData", () => {
  it("returns a MonthlyReport for the chosen period with income + category breakdown", async () => {
    const db = freshDb();
    seedPeriod(db);

    const result = await loadReportsData(db, { periodIndex: 0, now: NOW });

    expect(result.report.totalIncomeCents).toBe(600000);
    expect(result.report.salaryIncomeCents).toBe(600000);
    expect(result.report.totalExpensesCents).toBe(8000 + 2000 + 15000);
    expect(result.report.categoryBreakdown.length).toBeGreaterThan(0);
    const names = result.report.categoryBreakdown.map((c) => c.categoryName);
    expect(names).toContain("Groceries");
    expect(names).toContain("Transport");
  });

  it("returns a non-empty cashflow series scoped to the period", async () => {
    const db = freshDb();
    seedPeriod(db);

    const result = await loadReportsData(db, { periodIndex: 0, now: NOW });

    expect(result.cashflow.length).toBeGreaterThan(0);
    const totalIncome = result.cashflow.reduce((s, p) => s + p.incomeCents, 0);
    expect(totalIncome).toBe(600000);
  });

  it("derives envelope performance from saver accounts + allocations", async () => {
    const db = freshDb();
    seedPeriod(db);

    const result = await loadReportsData(db, { periodIndex: 0, now: NOW });

    const holiday = result.report.envelopePerformance.find((e) => e.saverId === "acc-holiday");
    expect(holiday).toBeDefined();
    expect(holiday!.allocatedCents).toBe(30000);
    expect(holiday!.spentCents).toBe(15000);
    expect(holiday!.varianceCents).toBe(15000);
  });

  it("derives debt payment breakdown from in-period debt payments", async () => {
    const db = freshDb();
    seedPeriod(db);

    const result = await loadReportsData(db, { periodIndex: 0, now: NOW });

    expect(result.report.totalDebtPaidCents).toBe(50000);
    const visa = result.report.debtPaymentBreakdown.find((d) => d.debtId === "debt-card");
    expect(visa).toBeDefined();
    expect(visa!.amountCents).toBe(50000);
    expect(visa!.isAutoTracked).toBe(false);
  });

  it("exposes the list of periods and the selected index", async () => {
    const db = freshDb();
    seedPeriod(db);

    const result = await loadReportsData(db, { periodIndex: 0, now: NOW });

    expect(result.periods.length).toBeGreaterThan(0);
    expect(result.selectedIndex).toBe(0);
    expect(result.periods[0]!.label).toBeTruthy();
  });

  it("falls back to calendar months when no salary transactions exist", async () => {
    const db = freshDb();
    new DrizzleCategoryRepo(db); // touch repo export to ensure it resolves
    const result = await loadReportsData(db, { periodIndex: 0, now: NOW });
    // No salary → calendar fallback; report still builds (zeroes are fine).
    expect(result.periods.length).toBeGreaterThan(0);
    expect(result.report.totalIncomeCents).toBe(0);
  });

  it("never leaks the encryption key in the returned data", async () => {
    const db = freshDb();
    seedPeriod(db);
    const result = await loadReportsData(db, { periodIndex: 0, now: NOW });
    expect(JSON.stringify(result)).not.toContain(KEY);
  });
});
