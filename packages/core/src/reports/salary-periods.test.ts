import { describe, it, expect } from "vitest";
import { deriveSalaryPeriods, type ReportTxn } from "./salary-periods";

const t = (id: string, over: Partial<ReportTxn>): ReportTxn => ({
  id, amountCents: -1000, isSalary: false, isTransfer: false,
  categoryId: null, parentCategoryId: null, settledAt: null,
  createdAt: "2026-01-01T00:00:00.000Z", tags: [], ...over,
});

describe("deriveSalaryPeriods", () => {
  it("windows pay-cycle to pay-cycle, most recent first, end = nextStart − 1 day", () => {
    const txns = [
      t("s1", { isSalary: true, amountCents: 500000, createdAt: "2026-01-15T00:00:00.000Z" }),
      t("s2", { isSalary: true, amountCents: 500000, createdAt: "2026-02-15T00:00:00.000Z" }),
    ];
    const periods = deriveSalaryPeriods(txns, "2026-03-01T00:00:00.000Z");
    expect(periods).toHaveLength(2);
    expect(periods[0]!.index).toBe(0);
    expect(periods[0]!.startDate).toBe("2026-02-15T00:00:00.000Z"); // most recent first
    expect(periods[1]!.endDate).toBe("2026-02-14T00:00:00.000Z");   // prev ends day before next
    expect(periods[0]!.salaryAmountCents).toBe(500000);
  });

  it("last (open) period ends at `now`", () => {
    const txns = [t("s1", { isSalary: true, createdAt: "2026-02-15T00:00:00.000Z", amountCents: 500000 })];
    const periods = deriveSalaryPeriods(txns, "2026-03-10T00:00:00.000Z");
    expect(periods[0]!.endDate).toBe("2026-03-10T00:00:00.000Z");
  });

  it("falls back to calendar months when no salary txns", () => {
    const periods = deriveSalaryPeriods([t("x", {})], "2026-03-10T00:00:00.000Z");
    expect(periods.length).toBeGreaterThan(0);
    expect(periods[0]!.salaryAmountCents).toBe(0);
    expect(periods[0]!.label).toMatch(/March 2026/);
  });

  it("prefers settledAt over createdAt for the window date", () => {
    const txns = [t("s1", { isSalary: true, amountCents: 1, createdAt: "2026-02-01T00:00:00.000Z", settledAt: "2026-02-15T00:00:00.000Z" })];
    expect(deriveSalaryPeriods(txns, "2026-03-01T00:00:00.000Z")[0]!.startDate).toBe("2026-02-15T00:00:00.000Z");
  });
});
