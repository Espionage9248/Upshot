import { describe, it, expect } from "vitest";
import { buildTagSummary } from "./tag-summary";
import type { ReportTxn } from "./salary-periods";

const t = (id: string, over: Partial<ReportTxn>): ReportTxn => ({
  id, amountCents: -1000, isSalary: false, isTransfer: false,
  categoryId: null, parentCategoryId: null, settledAt: null,
  createdAt: "2026-01-01T00:00:00.000Z", tags: [], ...over,
});

describe("buildTagSummary", () => {
  it("groups by tag, sums absolute expense cents, counts transactions", () => {
    const txns = [
      t("a", { amountCents: -3000, tags: ["food", "lunch"] }),
      t("b", { amountCents: -2000, tags: ["food"] }),
      t("c", { amountCents: -5000, tags: ["transport"] }),
    ];
    const result = buildTagSummary(txns);
    const food = result.find((r) => r.tag === "food")!;
    expect(food.totalCents).toBe(5000);
    expect(food.transactionCount).toBe(2);

    const lunch = result.find((r) => r.tag === "lunch")!;
    expect(lunch.totalCents).toBe(3000);
    expect(lunch.transactionCount).toBe(1);

    const transport = result.find((r) => r.tag === "transport")!;
    expect(transport.totalCents).toBe(5000);
  });

  it("excludes income and transfers", () => {
    const txns = [
      t("income",   { amountCents: 5000,  tags: ["salary"] }),
      t("transfer", { amountCents: -1000, isTransfer: true, tags: ["savings"] }),
      t("expense",  { amountCents: -500,  tags: ["food"] }),
    ];
    const result = buildTagSummary(txns);
    expect(result.map((r) => r.tag)).toEqual(["food"]);
  });

  it("skips txns with no tags", () => {
    const txns = [
      t("a", { amountCents: -1000, tags: [] }),
      t("b", { amountCents: -500, tags: ["food"] }),
    ];
    const result = buildTagSummary(txns);
    expect(result).toHaveLength(1);
    expect(result[0]!.tag).toBe("food");
  });

  it("sorts by totalCents descending", () => {
    const txns = [
      t("a", { amountCents: -1000, tags: ["small"] }),
      t("b", { amountCents: -9000, tags: ["big"] }),
    ];
    const result = buildTagSummary(txns);
    expect(result[0]!.tag).toBe("big");
    expect(result[1]!.tag).toBe("small");
  });

  it("respects optional startISO / endISO date window using settledAt ?? createdAt", () => {
    const txns = [
      t("before", { amountCents: -1000, tags: ["food"], createdAt: "2026-01-15T00:00:00.000Z" }),
      t("inside", { amountCents: -2000, tags: ["food"], createdAt: "2026-02-10T00:00:00.000Z" }),
      t("after",  { amountCents: -3000, tags: ["food"], createdAt: "2026-03-10T00:00:00.000Z" }),
    ];
    const result = buildTagSummary(txns, "2026-02-01", "2026-02-28");
    expect(result).toHaveLength(1);
    expect(result[0]!.totalCents).toBe(2000);
  });

  it("uses settledAt over createdAt for the date window check", () => {
    const txns = [
      // createdAt is inside window but settledAt is outside → should be excluded
      t("x", {
        amountCents: -1000, tags: ["food"],
        createdAt: "2026-02-10T00:00:00.000Z",
        settledAt: "2026-03-05T00:00:00.000Z",
      }),
    ];
    const result = buildTagSummary(txns, "2026-02-01", "2026-02-28");
    expect(result).toHaveLength(0);
  });

  it("returns all when no date window provided", () => {
    const txns = [
      t("a", { amountCents: -1000, tags: ["food"], createdAt: "2025-01-01T00:00:00.000Z" }),
      t("b", { amountCents: -2000, tags: ["food"], createdAt: "2026-06-01T00:00:00.000Z" }),
    ];
    const result = buildTagSummary(txns);
    expect(result[0]!.totalCents).toBe(3000);
  });
});
