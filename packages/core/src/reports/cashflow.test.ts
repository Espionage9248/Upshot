import { describe, it, expect } from "vitest";
import { buildCashflow } from "./cashflow";
import type { ReportTxn } from "./salary-periods";

const t = (id: string, over: Partial<ReportTxn>): ReportTxn => ({
  id, amountCents: -1000, isSalary: false, isTransfer: false,
  categoryId: null, parentCategoryId: null, settledAt: null,
  createdAt: "2026-01-01T00:00:00.000Z", tags: [], ...over,
});

describe("buildCashflow", () => {
  it("buckets a 2-day span into 2 daily points with correct cents", () => {
    const txns = [
      t("a", { amountCents:  5000, settledAt: "2026-03-01T10:00:00.000Z" }), // income
      t("b", { amountCents: -2000, settledAt: "2026-03-01T11:00:00.000Z" }), // expense
      t("c", { amountCents: -3000, settledAt: "2026-03-02T09:00:00.000Z" }), // expense
    ];
    const result = buildCashflow(txns, "2026-03-01", "2026-03-02", "day");
    expect(result).toHaveLength(2);

    const day1 = result.find((p) => p.date === "2026-03-01")!;
    expect(day1.incomeCents).toBe(5000);
    expect(day1.expenseCents).toBe(2000);
    expect(day1.netCents).toBe(3000);

    const day2 = result.find((p) => p.date === "2026-03-02")!;
    expect(day2.incomeCents).toBe(0);
    expect(day2.expenseCents).toBe(3000);
    expect(day2.netCents).toBe(-3000);
  });

  it("excludes transfers", () => {
    const txns = [
      t("a", { amountCents: -1000, isTransfer: true, settledAt: "2026-03-01T00:00:00.000Z" }),
      t("b", { amountCents: -500, settledAt: "2026-03-01T00:00:00.000Z" }),
    ];
    const result = buildCashflow(txns, "2026-03-01", "2026-03-01", "day");
    expect(result).toHaveLength(1);
    expect(result[0]!.expenseCents).toBe(500);
  });

  it("excludes txns outside [start, end]", () => {
    const txns = [
      t("before", { amountCents: -1000, settledAt: "2026-02-28T23:59:59.000Z" }),
      t("inside", { amountCents: -500,  settledAt: "2026-03-01T00:00:00.000Z" }),
      t("after",  { amountCents: -2000, settledAt: "2026-03-03T00:00:00.000Z" }),
    ];
    const result = buildCashflow(txns, "2026-03-01", "2026-03-02", "day");
    const total = result.reduce((s, p) => s + p.expenseCents, 0);
    expect(total).toBe(500);
  });

  it("falls back to createdAt when settledAt is null", () => {
    const txns = [
      t("a", { amountCents: -700, settledAt: null, createdAt: "2026-03-01T08:00:00.000Z" }),
    ];
    const result = buildCashflow(txns, "2026-03-01", "2026-03-01", "day");
    expect(result).toHaveLength(1);
    expect(result[0]!.expenseCents).toBe(700);
  });

  it("weekly bucketing groups days into ISO week bucket (Monday start)", () => {
    // 2026-03-02 is a Monday; 2026-03-06 is a Friday — same week
    const txns = [
      t("a", { amountCents: -1000, settledAt: "2026-03-02T00:00:00.000Z" }),
      t("b", { amountCents: -2000, settledAt: "2026-03-06T00:00:00.000Z" }),
    ];
    const result = buildCashflow(txns, "2026-03-02", "2026-03-06", "week");
    // Both fall in the same ISO week starting 2026-03-02
    expect(result).toHaveLength(1);
    expect(result[0]!.expenseCents).toBe(3000);
  });
});
