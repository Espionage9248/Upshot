import { describe, it, expect } from "vitest";
import { toCsv, taxEstimateToCsv, yearlyReportToCsv, monthlyReportToCsv } from "./csv";
import { buildTaxEstimate } from "../tax";
import { buildYearlyReport, buildMonthlyReport } from "../reports";
import type { SalaryPeriod } from "../reports";

describe("toCsv", () => {
  it("joins headers and rows with CRLF", () => {
    expect(toCsv(["a", "b"], [[1, 2], [3, 4]])).toBe("a,b\r\n1,2\r\n3,4");
  });
  it("quotes cells containing comma, quote, or newline", () => {
    expect(toCsv(["x"], [["a,b"]])).toBe('x\r\n"a,b"');
    expect(toCsv(["x"], [['he said "hi"']])).toBe('x\r\n"he said ""hi"""');
    expect(toCsv(["x"], [["line1\nline2"]])).toBe('x\r\n"line1\nline2"');
  });
});

describe("taxEstimateToCsv", () => {
  it("emits a category section with a dollar-formatted total", () => {
    const e = buildTaxEstimate({
      grossIncomeCents: 9_000_000,
      paygWithheldCents: 2_000_000,
      deductibles: [{ category: "Home office", cents: 124_000, count: 12 }],
      medicareLevyApplies: true,
      fy: 2026,
    });
    const csv = taxEstimateToCsv(e);
    expect(csv).toContain("Home office");
    expect(csv).toContain("1240.00");
    expect(csv).toContain("Deductible total");
  });
});

describe("yearlyReportToCsv", () => {
  it("serialises yearly report with monthly breakdown", () => {
    const report = buildYearlyReport([], 2026, {
      isFinancialYear: true,
      now: "2026-06-27",
      categoryNames: new Map(),
    });
    const csv = yearlyReportToCsv(report);
    expect(csv).toContain("Month,Income,Expenses,Net,Savings rate %");
    expect(csv).toContain("2025-07");
  });
});

describe("monthlyReportToCsv", () => {
  it("serialises monthly report with category breakdown", () => {
    const period: SalaryPeriod = {
      index: 0,
      startDate: "2026-06-01",
      endDate: "2026-06-30",
      salaryAmountCents: 500_000,
      salaryTransactionId: "tx1",
      label: "1 Jun – 30 Jun 2026",
    };
    const report = buildMonthlyReport({
      period,
      txns: [],
      categoryNames: new Map(),
      envelopePerformance: [],
      debtPaymentBreakdown: [],
    });
    const csv = monthlyReportToCsv(report);
    expect(csv).toContain("Category,Amount,Transactions");
  });
});
