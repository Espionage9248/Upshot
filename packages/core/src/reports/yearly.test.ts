/**
 * Tests for buildYearlyReport — calendar-year and AU financial-year.
 */

import { describe, it, expect } from "vitest";
import { buildYearlyReport } from "./yearly";
import type { ReportTxn } from "./salary-periods";

/** Local fixture helper. All ISO strings default to 2025-06-15 (mid-year). */
const t = (id: string, over: Partial<ReportTxn>): ReportTxn => ({
  id,
  amountCents: -1000,
  isSalary: false,
  isTransfer: false,
  categoryId: null,
  parentCategoryId: null,
  settledAt: null,
  createdAt: "2025-06-15T00:00:00.000Z",
  tags: [],
  ...over,
});

const noCategories = new Map<string, { name: string; parentName: string | null }>();

// ---------------------------------------------------------------------------
// Calendar year
// ---------------------------------------------------------------------------

describe("buildYearlyReport — calendar year", () => {
  it("produces 12 monthly buckets in yyyy-MM order", () => {
    // Transactions spread across Jan–Dec 2025
    const txns: ReportTxn[] = [
      t("inc-jan", { amountCents: 500000, createdAt: "2025-01-20T00:00:00.000Z" }),
      t("exp-jan", { amountCents: -20000, createdAt: "2025-01-25T00:00:00.000Z" }),
      t("inc-jun", { amountCents: 500000, createdAt: "2025-06-15T00:00:00.000Z" }),
      t("exp-jun", { amountCents: -30000, createdAt: "2025-06-20T00:00:00.000Z" }),
      t("inc-dec", { amountCents: 500000, createdAt: "2025-12-10T00:00:00.000Z" }),
      t("exp-dec", { amountCents: -15000, createdAt: "2025-12-11T00:00:00.000Z" }),
    ];

    // Past year — report window 2025 is fully complete relative to now=2026-06-26
    const report = buildYearlyReport(txns, 2025, {
      isFinancialYear: false,
      now: "2026-06-26T00:00:00.000Z",
      categoryNames: noCategories,
    });

    expect(report.year).toBe(2025);
    expect(report.isPartialYear).toBe(false);

    // 12 buckets in calendar order
    expect(report.monthlyBreakdown).toHaveLength(12);
    expect(report.monthlyBreakdown[0]!.month).toBe("2025-01");
    expect(report.monthlyBreakdown[11]!.month).toBe("2025-12");

    // Jan bucket
    const jan = report.monthlyBreakdown.find((m) => m.month === "2025-01")!;
    expect(jan.incomeCents).toBe(500000);
    expect(jan.expensesCents).toBe(20000);
    expect(jan.netCents).toBe(480000);
    expect(jan.savingsRate).toBeCloseTo(480000 / 500000, 5);

    // Empty bucket (e.g. Feb)
    const feb = report.monthlyBreakdown.find((m) => m.month === "2025-02")!;
    expect(feb.incomeCents).toBe(0);
    expect(feb.expensesCents).toBe(0);
    expect(feb.savingsRate).toBe(0);
  });

  it("aggregates totals correctly, excluding transfers", () => {
    const txns: ReportTxn[] = [
      t("inc1", { amountCents: 600000, createdAt: "2025-03-01T00:00:00.000Z" }),
      t("exp1", { amountCents: -100000, createdAt: "2025-03-15T00:00:00.000Z" }),
      t("xfer", { amountCents: -50000, isTransfer: true, createdAt: "2025-03-20T00:00:00.000Z" }),
    ];

    const report = buildYearlyReport(txns, 2025, {
      isFinancialYear: false,
      now: "2026-06-26T00:00:00.000Z",
      categoryNames: noCategories,
    });

    expect(report.totalIncomeCents).toBe(600000);
    expect(report.totalExpensesCents).toBe(100000); // transfer excluded
    expect(report.netCents).toBe(500000);
  });

  it("isPartialYear = true when year window contains now", () => {
    // Transactions in a year that hasn't ended yet relative to now
    const txns: ReportTxn[] = [
      t("inc", { amountCents: 500000, createdAt: "2026-01-10T00:00:00.000Z" }),
    ];

    const report = buildYearlyReport(txns, 2026, {
      isFinancialYear: false,
      now: "2026-06-26T00:00:00.000Z",
      categoryNames: noCategories,
    });

    expect(report.isPartialYear).toBe(true);
  });

  it("isPartialYear = false for a fully elapsed year", () => {
    const txns: ReportTxn[] = [
      t("inc", { amountCents: 500000, createdAt: "2024-06-10T00:00:00.000Z" }),
    ];

    const report = buildYearlyReport(txns, 2024, {
      isFinancialYear: false,
      now: "2026-06-26T00:00:00.000Z",
      categoryNames: noCategories,
    });

    expect(report.isPartialYear).toBe(false);
  });

  it("averages are Math.round over months elapsed", () => {
    // 3 months with income/expenses
    const txns: ReportTxn[] = [
      t("i1", { amountCents: 300000, createdAt: "2025-01-10T00:00:00.000Z" }),
      t("e1", { amountCents: -90000, createdAt: "2025-01-10T00:00:00.000Z" }),
      t("i2", { amountCents: 300000, createdAt: "2025-02-10T00:00:00.000Z" }),
      t("e2", { amountCents: -60000, createdAt: "2025-02-10T00:00:00.000Z" }),
      t("i3", { amountCents: 300000, createdAt: "2025-03-10T00:00:00.000Z" }),
      t("e3", { amountCents: -75000, createdAt: "2025-03-10T00:00:00.000Z" }),
    ];

    // now = end of March, so 3 months elapsed
    const report = buildYearlyReport(txns, 2025, {
      isFinancialYear: false,
      now: "2025-03-31T23:59:59.000Z",
      categoryNames: noCategories,
    });

    // monthsElapsed = 3 (Jan, Feb, Mar covered by now)
    expect(report.totalIncomeCents).toBe(900000);
    expect(report.totalExpensesCents).toBe(225000);
    expect(report.averageMonthlyIncomeCents).toBe(Math.round(900000 / 3));
    expect(report.averageMonthlyExpensesCents).toBe(Math.round(225000 / 3));
  });

  it("previousYearComparison is null when previousYearTxns not supplied", () => {
    const txns: ReportTxn[] = [
      t("inc", { amountCents: 500000, createdAt: "2025-06-10T00:00:00.000Z" }),
    ];

    const report = buildYearlyReport(txns, 2025, {
      isFinancialYear: false,
      now: "2026-06-26T00:00:00.000Z",
      categoryNames: noCategories,
    });

    expect(report.previousYearComparison).toBeNull();
  });

  it("previousYearComparison computes percentages and net when supplied", () => {
    const txns: ReportTxn[] = [
      t("inc", { amountCents: 600000, createdAt: "2025-06-10T00:00:00.000Z" }),
      t("exp", { amountCents: -200000, createdAt: "2025-06-15T00:00:00.000Z" }),
    ];

    const prevTxns: ReportTxn[] = [
      t("prev-inc", { amountCents: 500000, createdAt: "2024-06-10T00:00:00.000Z" }),
      t("prev-exp", { amountCents: -100000, createdAt: "2024-06-15T00:00:00.000Z" }),
    ];

    const report = buildYearlyReport(txns, 2025, {
      isFinancialYear: false,
      now: "2026-06-26T00:00:00.000Z",
      categoryNames: noCategories,
      previousYearTxns: prevTxns,
    });

    expect(report.previousYearComparison).not.toBeNull();
    const yoy = report.previousYearComparison!;

    // incomeChangePct: (600000 - 500000) / 500000 * 100 = 20
    expect(yoy.incomeChangePct).toBeCloseTo(20, 5);
    // expenseChangePct: (200000 - 100000) / 100000 * 100 = 100
    expect(yoy.expenseChangePct).toBeCloseTo(100, 5);
    // netChangeCents: (600000 - 200000) - (500000 - 100000) = 400000 - 400000 = 0
    expect(yoy.netChangeCents).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Category breakdown windowing
// ---------------------------------------------------------------------------

describe("buildYearlyReport — categoryBreakdown window scoping", () => {
  it("calendar year: excludes expenses from a different year", () => {
    const catNames = new Map([
      ["cat-food", { name: "Groceries", parentName: null }],
      ["cat-rent", { name: "Rent", parentName: null }],
    ]);

    const txns: ReportTxn[] = [
      // 2025 expenses (the selected year)
      t("exp-2025-a", {
        amountCents: -50000,
        categoryId: "cat-food",
        createdAt: "2025-03-10T00:00:00.000Z",
      }),
      t("exp-2025-b", {
        amountCents: -30000,
        categoryId: "cat-food",
        createdAt: "2025-09-01T00:00:00.000Z",
      }),
      // 2024 expense (a DIFFERENT year — must be excluded from breakdown)
      t("exp-2024-rent", {
        amountCents: -200000,
        categoryId: "cat-rent",
        createdAt: "2024-11-15T00:00:00.000Z",
      }),
    ];

    const report = buildYearlyReport(txns, 2025, {
      isFinancialYear: false,
      now: "2026-06-27T00:00:00.000Z",
      categoryNames: catNames,
    });

    // Only 2025 expenses should appear — Groceries with 80000 total
    expect(report.categoryBreakdown).toHaveLength(1);
    const groceries = report.categoryBreakdown[0]!;
    expect(groceries.categoryName).toBe("Groceries");
    expect(groceries.totalCents).toBe(80000); // 50000 + 30000
    expect(groceries.transactionCount).toBe(2);

    // Prior-year Rent must NOT appear
    const rent = report.categoryBreakdown.find((c) => c.categoryName === "Rent");
    expect(rent).toBeUndefined();
  });

  it("financial year: excludes expenses outside the FY window", () => {
    const catNames = new Map([
      ["cat-dine", { name: "Dining", parentName: null }],
      ["cat-gym", { name: "Gym", parentName: null }],
    ]);

    const txns: ReportTxn[] = [
      // FY2025 expenses (1 Jul 2024 – 30 Jun 2025)
      t("exp-fy25-a", {
        amountCents: -40000,
        categoryId: "cat-dine",
        createdAt: "2024-08-10T00:00:00.000Z",
      }),
      t("exp-fy25-b", {
        amountCents: -20000,
        categoryId: "cat-dine",
        createdAt: "2025-04-15T00:00:00.000Z",
      }),
      // FY2024 expense (1 Jul 2023 – 30 Jun 2024) — must be excluded
      t("exp-fy24-gym", {
        amountCents: -150000,
        categoryId: "cat-gym",
        createdAt: "2024-02-20T00:00:00.000Z",
      }),
    ];

    const report = buildYearlyReport(txns, 2025, {
      isFinancialYear: true,
      now: "2026-06-27T00:00:00.000Z",
      categoryNames: catNames,
    });

    // Only FY2025 expenses: Dining = 60000
    expect(report.categoryBreakdown).toHaveLength(1);
    const dining = report.categoryBreakdown[0]!;
    expect(dining.categoryName).toBe("Dining");
    expect(dining.totalCents).toBe(60000); // 40000 + 20000
    expect(dining.transactionCount).toBe(2);

    // Prior-FY Gym must NOT appear
    const gym = report.categoryBreakdown.find((c) => c.categoryName === "Gym");
    expect(gym).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Australian financial year
// ---------------------------------------------------------------------------

describe("buildYearlyReport — financial year", () => {
  it("FY2025 window is Jul 2024 – Jun 2025 (12 buckets Jul-first)", () => {
    // Transactions spanning FY2025 (1 Jul 2024 – 30 Jun 2025)
    const txns: ReportTxn[] = [
      t("inc-jul",  { amountCents: 500000, createdAt: "2024-07-15T00:00:00.000Z" }),
      t("exp-jul",  { amountCents: -20000, createdAt: "2024-07-20T00:00:00.000Z" }),
      t("inc-jan",  { amountCents: 500000, createdAt: "2025-01-10T00:00:00.000Z" }),
      t("exp-jan",  { amountCents: -30000, createdAt: "2025-01-15T00:00:00.000Z" }),
      t("inc-jun",  { amountCents: 500000, createdAt: "2025-06-01T00:00:00.000Z" }),
      t("exp-jun",  { amountCents: -10000, createdAt: "2025-06-10T00:00:00.000Z" }),
    ];

    // now past FY2025 end
    const report = buildYearlyReport(txns, 2025, {
      isFinancialYear: true,
      now: "2026-06-26T00:00:00.000Z",
      categoryNames: noCategories,
    });

    expect(report.year).toBe(2025);
    expect(report.isPartialYear).toBe(false);

    // 12 buckets, first = 2024-07, last = 2025-06
    expect(report.monthlyBreakdown).toHaveLength(12);
    expect(report.monthlyBreakdown[0]!.month).toBe("2024-07");
    expect(report.monthlyBreakdown[11]!.month).toBe("2025-06");

    // Jul 2024 bucket
    const jul = report.monthlyBreakdown.find((m) => m.month === "2024-07")!;
    expect(jul.incomeCents).toBe(500000);
    expect(jul.expensesCents).toBe(20000);

    // Jan 2025 bucket
    const jan = report.monthlyBreakdown.find((m) => m.month === "2025-01")!;
    expect(jan.incomeCents).toBe(500000);
    expect(jan.expensesCents).toBe(30000);
  });

  it("FY2026 (1 Jul 2025 – 30 Jun 2026) is partial when now = 2026-06-26", () => {
    const txns: ReportTxn[] = [
      t("inc", { amountCents: 500000, createdAt: "2025-07-15T00:00:00.000Z" }),
    ];

    const report = buildYearlyReport(txns, 2026, {
      isFinancialYear: true,
      now: "2026-06-26T00:00:00.000Z",
      categoryNames: noCategories,
    });

    expect(report.isPartialYear).toBe(true);
  });

  it("FY previousYearComparison is null when previousYearTxns not supplied", () => {
    const txns: ReportTxn[] = [
      t("inc", { amountCents: 500000, createdAt: "2024-08-10T00:00:00.000Z" }),
    ];

    const report = buildYearlyReport(txns, 2025, {
      isFinancialYear: true,
      now: "2026-06-26T00:00:00.000Z",
      categoryNames: noCategories,
    });

    expect(report.previousYearComparison).toBeNull();
  });

  it("FY previousYearComparison computes correctly when supplied", () => {
    const txns: ReportTxn[] = [
      t("inc", { amountCents: 800000, createdAt: "2024-09-10T00:00:00.000Z" }),
      t("exp", { amountCents: -300000, createdAt: "2024-10-10T00:00:00.000Z" }),
    ];

    const prevTxns: ReportTxn[] = [
      t("prev-inc", { amountCents: 400000, createdAt: "2023-09-10T00:00:00.000Z" }),
      t("prev-exp", { amountCents: -200000, createdAt: "2023-10-10T00:00:00.000Z" }),
    ];

    const report = buildYearlyReport(txns, 2025, {
      isFinancialYear: true,
      now: "2026-06-26T00:00:00.000Z",
      categoryNames: noCategories,
      previousYearTxns: prevTxns,
    });

    const yoy = report.previousYearComparison!;

    // incomeChangePct: (800000 - 400000) / 400000 * 100 = 100
    expect(yoy.incomeChangePct).toBeCloseTo(100, 5);
    // expenseChangePct: (300000 - 200000) / 200000 * 100 = 50
    expect(yoy.expenseChangePct).toBeCloseTo(50, 5);
    // netChangeCents: (800000 - 300000) - (400000 - 200000) = 500000 - 200000 = 300000
    expect(yoy.netChangeCents).toBe(300000);
  });
});
