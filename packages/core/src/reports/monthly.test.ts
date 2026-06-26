import { describe, it, expect } from "vitest";
import { buildMonthlyReport } from "./monthly";
import type { ReportTxn, SalaryPeriod } from "./salary-periods";
import type { EnvelopePerformanceItem, DebtPaymentBreakdownItem } from "./monthly";

const t = (id: string, over: Partial<ReportTxn>): ReportTxn => ({
  id,
  amountCents: -1000,
  isSalary: false,
  isTransfer: false,
  categoryId: null,
  parentCategoryId: null,
  settledAt: null,
  createdAt: "2026-01-15T00:00:00.000Z",
  tags: [],
  ...over,
});

const period: SalaryPeriod = {
  index: 0,
  startDate: "2026-01-15T00:00:00.000Z",
  endDate: "2026-02-14T23:59:59.999Z",
  salaryAmountCents: 500000,
  salaryTransactionId: "tx-salary",
  label: "15 Jan – 14 Feb 2026",
};

const catMap = new Map([
  ["cat-groceries", { name: "Groceries", parentName: "Living" }],
  ["cat-transport", { name: "Transport", parentName: null }],
  ["cat-eating",    { name: "Eating Out", parentName: "Living" }],
  ["cat-utilities", { name: "Utilities", parentName: "Living" }],
]);

const noEnvelopes: EnvelopePerformanceItem[] = [];
const noDebts: DebtPaymentBreakdownItem[] = [];

describe("buildMonthlyReport", () => {
  it("correctly calculates all cents fields and sorted categoryBreakdown", () => {
    const txns = [
      // salary income
      t("sal", { amountCents: 500000, isSalary: true, categoryId: null }),
      // other income
      t("bonus", { amountCents: 50000, isSalary: false, categoryId: null }),
      // expenses
      t("groc", { amountCents: -12000, categoryId: "cat-groceries" }),
      t("groc2", { amountCents: -8000, categoryId: "cat-groceries" }),
      t("eat", { amountCents: -25000, categoryId: "cat-eating" }),
      t("util", { amountCents: -6000, categoryId: "cat-utilities" }),
      // transfer — should be excluded from expenses
      t("xfer", { amountCents: -30000, isTransfer: true, categoryId: null }),
    ];

    const report = buildMonthlyReport({
      period,
      txns,
      categoryNames: catMap,
      envelopePerformance: noEnvelopes,
      debtPaymentBreakdown: noDebts,
    });

    expect(report.period).toBe(period);

    // Income
    expect(report.salaryIncomeCents).toBe(500000);
    expect(report.otherIncomeCents).toBe(50000);
    expect(report.totalIncomeCents).toBe(550000);

    // Expenses: 12000 + 8000 + 25000 + 6000 = 51000 (transfer excluded)
    expect(report.totalExpensesCents).toBe(51000);

    // Net
    expect(report.netCents).toBe(499000); // 550000 - 51000

    // Savings rate: 499000 / 550000 ≈ 0.9072...
    expect(report.savingsRate).toBeCloseTo(499000 / 550000, 5);

    // Debt payments
    expect(report.totalDebtPaidCents).toBe(0);
    expect(report.debtPaymentBreakdown).toEqual([]);

    // Envelope performance
    expect(report.envelopePerformance).toEqual([]);

    // Category breakdown — sorted desc by totalCents
    // Eating Out: 25000, Groceries: 20000, Utilities: 6000
    expect(report.categoryBreakdown).toHaveLength(3);
    expect(report.categoryBreakdown[0]!.categoryName).toBe("Eating Out");
    expect(report.categoryBreakdown[0]!.totalCents).toBe(25000);
    expect(report.categoryBreakdown[1]!.categoryName).toBe("Groceries");
    expect(report.categoryBreakdown[1]!.totalCents).toBe(20000);
    expect(report.categoryBreakdown[2]!.categoryName).toBe("Utilities");
    expect(report.categoryBreakdown[2]!.totalCents).toBe(6000);
  });

  it("savingsRate is 0 when no income", () => {
    const txns = [t("exp", { amountCents: -5000, categoryId: "cat-groceries" })];
    const report = buildMonthlyReport({
      period,
      txns,
      categoryNames: catMap,
      envelopePerformance: noEnvelopes,
      debtPaymentBreakdown: noDebts,
    });
    expect(report.totalIncomeCents).toBe(0);
    expect(report.savingsRate).toBe(0);
  });

  it("fires a warning insight for a negative-net period", () => {
    const txns = [
      t("sal", { amountCents: 100000, isSalary: true, categoryId: null }),
      t("exp1", { amountCents: -80000, categoryId: "cat-groceries" }),
      t("exp2", { amountCents: -50000, categoryId: "cat-eating" }),
    ];

    const report = buildMonthlyReport({
      period,
      txns,
      categoryNames: catMap,
      envelopePerformance: noEnvelopes,
      debtPaymentBreakdown: noDebts,
    });

    expect(report.netCents).toBeLessThan(0);
    const warningInsights = report.insights.filter((i) => i.type === "warning");
    expect(warningInsights.length).toBeGreaterThan(0);
    // Should mention spending more than earned or negative savings rate
    expect(warningInsights[0]!.message).toMatch(/spent more than|negative|low savings/i);
  });

  it("fires a positive insight for a high savings rate", () => {
    const txns = [
      t("sal", { amountCents: 500000, isSalary: true, categoryId: null }),
      t("exp", { amountCents: -50000, categoryId: "cat-groceries" }),
    ];

    const report = buildMonthlyReport({
      period,
      txns,
      categoryNames: catMap,
      envelopePerformance: noEnvelopes,
      debtPaymentBreakdown: noDebts,
    });

    const positiveInsights = report.insights.filter((i) => i.type === "positive");
    expect(positiveInsights.length).toBeGreaterThan(0);
  });

  it("sums debt payments from breakdown input", () => {
    const debtBreakdown: DebtPaymentBreakdownItem[] = [
      { debtId: "debt-1", debtName: "Car Loan", amountCents: 20000, isAutoTracked: true },
      { debtId: "debt-2", debtName: "Credit Card", amountCents: 15000, isAutoTracked: false },
    ];

    const report = buildMonthlyReport({
      period,
      txns: [t("sal", { amountCents: 500000, isSalary: true })],
      categoryNames: catMap,
      envelopePerformance: noEnvelopes,
      debtPaymentBreakdown: debtBreakdown,
    });

    expect(report.totalDebtPaidCents).toBe(35000);
    expect(report.debtPaymentBreakdown).toEqual(debtBreakdown);
  });

  it("includes an over-budget envelope insight", () => {
    const envelopes: EnvelopePerformanceItem[] = [
      {
        saverId: "saver-1",
        saverName: "Emergency Fund",
        allocatedCents: 10000,
        spentCents: 15000,
        varianceCents: -5000,
        variancePercentage: -50,
      },
    ];

    const report = buildMonthlyReport({
      period,
      txns: [t("sal", { amountCents: 300000, isSalary: true })],
      categoryNames: catMap,
      envelopePerformance: envelopes,
      debtPaymentBreakdown: noDebts,
    });

    const warnings = report.insights.filter((i) => i.type === "warning" && /over budget/i.test(i.message));
    expect(warnings.length).toBeGreaterThan(0);
  });
});
