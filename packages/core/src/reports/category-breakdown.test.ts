import { describe, it, expect } from "vitest";
import { buildCategoryBreakdown } from "./category-breakdown";
import type { ReportTxn } from "./salary-periods";

const t = (id: string, over: Partial<ReportTxn>): ReportTxn => ({
  id, amountCents: -1000, isSalary: false, isTransfer: false,
  categoryId: null, parentCategoryId: null, settledAt: null,
  createdAt: "2026-01-01T00:00:00.000Z", tags: [], ...over,
});

const catMap = new Map([
  ["cat-food", { name: "Groceries", parentName: "Living" }],
  ["cat-eat",  { name: "Eating Out", parentName: "Living" }],
  ["cat-transport", { name: "Transport", parentName: null }],
]);

describe("buildCategoryBreakdown", () => {
  it("sums absolute expense cents per category, sorted desc", () => {
    // Use distinct totals to avoid tie-break ambiguity
    const txns = [
      t("a", { amountCents: -3000, categoryId: "cat-food" }),
      t("b", { amountCents: -1000, categoryId: "cat-food" }),
      t("c", { amountCents: -5000, categoryId: "cat-eat" }),
    ];
    const result = buildCategoryBreakdown(txns, catMap);
    expect(result).toHaveLength(2);
    // sorted desc: Eating Out (5000) then Groceries (4000)
    expect(result[0]!.categoryName).toBe("Eating Out");
    expect(result[0]!.totalCents).toBe(5000);
    expect(result[1]!.categoryName).toBe("Groceries");
    expect(result[1]!.totalCents).toBe(4000);
    // totals are strictly desc
    expect(result[0]!.totalCents).toBeGreaterThan(result[1]!.totalCents);
  });

  it("excludes income and transfers", () => {
    const txns = [
      t("income", { amountCents: 10000, categoryId: "cat-food" }),
      t("transfer", { amountCents: -2000, isTransfer: true, categoryId: "cat-food" }),
      t("expense", { amountCents: -3000, categoryId: "cat-food" }),
    ];
    const result = buildCategoryBreakdown(txns, catMap);
    expect(result).toHaveLength(1);
    expect(result[0]!.totalCents).toBe(3000);
  });

  it("percentageOfTotal sums to ~100", () => {
    const txns = [
      t("a", { amountCents: -3000, categoryId: "cat-food" }),
      t("b", { amountCents: -7000, categoryId: "cat-eat" }),
    ];
    const result = buildCategoryBreakdown(txns, catMap);
    const total = result.reduce((s, r) => s + r.percentageOfTotal, 0);
    expect(Math.round(total)).toBe(100);
  });

  it("uses parentCategoryName from the map", () => {
    const txns = [t("a", { amountCents: -1000, categoryId: "cat-transport" })];
    const result = buildCategoryBreakdown(txns, catMap);
    expect(result[0]!.parentCategoryName).toBeNull();
    expect(result[0]!.categoryName).toBe("Transport");

    const txns2 = [t("b", { amountCents: -1000, categoryId: "cat-food" })];
    const result2 = buildCategoryBreakdown(txns2, catMap);
    expect(result2[0]!.parentCategoryName).toBe("Living");
  });

  it("uses 'Uncategorised' when categoryId is null or not in map", () => {
    const txns = [
      t("a", { amountCents: -500, categoryId: null }),
      t("b", { amountCents: -300, categoryId: "cat-unknown" }),
    ];
    const result = buildCategoryBreakdown(txns, catMap);
    expect(result).toHaveLength(1);
    expect(result[0]!.categoryName).toBe("Uncategorised");
    expect(result[0]!.totalCents).toBe(800);
  });

  it("returns empty array when no expenses", () => {
    const result = buildCategoryBreakdown([], catMap);
    expect(result).toHaveLength(0);
  });
});
