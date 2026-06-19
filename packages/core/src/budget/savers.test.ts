import { describe, it, expect } from "vitest";
import { analyseSaver, analyseAllSavers, type SaverInput } from "./savers";

const base: SaverInput = {
  account: { id: "s1", name: "Holiday", balanceCents: 50_000, monthlyAllocationCents: 20_000 },
  month: "2026-06",
  transactions: [], // {amountCents, createdAt, accountId, transferAccountId?, isTransfer}
  saverAccountIds: new Set(["s1", "s2"]),
};

describe("analyseSaver", () => {
  it("computes variance and OPTIMAL trend when spend matches allocation", () => {
    const r = analyseSaver({ ...base, transactions: [
      { amountCents: -20_000, createdAt: "2026-06-10T00:00:00Z", accountId: "s1", isTransfer: false },
    ]});
    expect(r.monthlySpending).toBe(20_000);
    expect(r.variance).toBe(0);
    expect(r.trend).toBe("OPTIMAL");
  });

  it("excludes saver-to-saver transfers from spending", () => {
    const r = analyseSaver({ ...base, transactions: [
      { amountCents: -10_000, createdAt: "2026-06-10T00:00:00Z", accountId: "s1", isTransfer: true, transferAccountId: "s2" },
    ]});
    expect(r.monthlySpending).toBe(0);
  });

  it("reports OVERFUNDED when spending is well under allocation", () => {
    const r = analyseSaver({ ...base, transactions: [
      { amountCents: -5_000, createdAt: "2026-06-10T00:00:00Z", accountId: "s1", isTransfer: false },
    ]});
    expect(r.monthlySpending).toBe(5_000);
    expect(r.variance).toBe(15_000); // 20_000 - 5_000
    expect(r.variancePercentage).toBe(75); // (15_000 / 20_000) * 100
    expect(r.trend).toBe("OVERFUNDED");
  });

  it("reports UNDERFUNDED when spending exceeds allocation beyond tolerance", () => {
    const r = analyseSaver({ ...base, transactions: [
      { amountCents: -25_000, createdAt: "2026-06-10T00:00:00Z", accountId: "s1", isTransfer: false },
    ]});
    expect(r.monthlySpending).toBe(25_000);
    expect(r.variance).toBe(-5_000); // 20_000 - 25_000
    expect(r.variancePercentage).toBe(-25); // (-5_000 / 20_000) * 100
    expect(r.trend).toBe("UNDERFUNDED");
  });

  it("returns 0 variancePercentage when allocation is 0 (divide-by-zero guard)", () => {
    const r = analyseSaver({
      ...base,
      account: { id: "s1", name: "Holiday", balanceCents: 50_000, monthlyAllocationCents: 0 },
      transactions: [
        { amountCents: -3_000, createdAt: "2026-06-10T00:00:00Z", accountId: "s1", isTransfer: false },
      ],
    });
    expect(r.monthlyAllocation).toBe(0);
    expect(r.monthlySpending).toBe(3_000);
    expect(r.variance).toBe(-3_000);
    expect(r.variancePercentage).toBe(0);
  });

  it("derives allocation from incoming transfers when present, falling back otherwise", () => {
    const r = analyseSaver({ ...base, transactions: [
      { amountCents: 30_000, createdAt: "2026-06-02T00:00:00Z", accountId: "s1", isTransfer: true, transferAccountId: "ext" },
      { amountCents: -10_000, createdAt: "2026-06-10T00:00:00Z", accountId: "s1", isTransfer: false },
    ]});
    expect(r.monthlyAllocation).toBe(30_000); // from incoming transfer, not the 20_000 fallback
    expect(r.monthlySpending).toBe(10_000);
  });

  it("produces a 6-month history (most recent first) excluding the current month", () => {
    const r = analyseSaver({ ...base, transactions: [
      { amountCents: -4_000, createdAt: "2026-05-10T00:00:00Z", accountId: "s1", isTransfer: false },
      { amountCents: -6_000, createdAt: "2026-04-10T00:00:00Z", accountId: "s1", isTransfer: false },
    ]});
    expect(r.last6Months).toHaveLength(6);
    expect(r.last6Months.map(m => m.month)).toEqual([
      "2026-05", "2026-04", "2026-03", "2026-02", "2026-01", "2025-12",
    ]);
    const may = r.last6Months[0]!;
    expect(may).toEqual({ month: "2026-05", allocated: 20_000, spent: 4_000, variance: 16_000 });
    const apr = r.last6Months[1]!;
    expect(apr.spent).toBe(6_000);
  });

  it("averages monthly spending over the last 6 months", () => {
    const r = analyseSaver({ ...base, transactions: [
      { amountCents: -4_000, createdAt: "2026-05-10T00:00:00Z", accountId: "s1", isTransfer: false },
      { amountCents: -8_000, createdAt: "2026-04-10T00:00:00Z", accountId: "s1", isTransfer: false },
    ]});
    // (4_000 + 8_000 + 0 + 0 + 0 + 0) / 6 = 2_000
    expect(r.averageMonthlySpending).toBe(2_000);
  });
});

describe("analyseAllSavers", () => {
  it("analyses each saver input independently", () => {
    const inputs: SaverInput[] = [
      {
        account: { id: "s1", name: "Holiday", balanceCents: 50_000, monthlyAllocationCents: 20_000 },
        month: "2026-06",
        transactions: [{ amountCents: -20_000, createdAt: "2026-06-10T00:00:00Z", accountId: "s1", isTransfer: false }],
        saverAccountIds: new Set(["s1", "s2"]),
      },
      {
        account: { id: "s2", name: "Car", balanceCents: 10_000, monthlyAllocationCents: 10_000 },
        month: "2026-06",
        transactions: [{ amountCents: -2_000, createdAt: "2026-06-10T00:00:00Z", accountId: "s2", isTransfer: false }],
        saverAccountIds: new Set(["s1", "s2"]),
      },
    ];
    const results = analyseAllSavers(inputs);
    expect(results.map(r => r.saverId)).toEqual(["s1", "s2"]);
    expect(results[0]!.trend).toBe("OPTIMAL");
    expect(results[1]!.trend).toBe("OVERFUNDED");
  });
});
