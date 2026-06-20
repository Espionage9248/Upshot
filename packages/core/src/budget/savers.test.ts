import { describe, it, expect } from "vitest";
import { analyseSaver, analyseAllSavers, type SaverInput } from "./savers";

const base: SaverInput = {
  account: {
    id: "s1",
    name: "Holiday",
    balanceCents: 50_000,
    monthlyAllocationCents: 20_000,
    goalTargetCents: null,
    goalTargetDate: null,
  },
  month: "2026-06",
  transactions: [], // {amountCents, createdAt, accountId, transferAccountId?, isTransfer}
  saverAccountIds: new Set(["s1", "s2"]),
};

describe("analyseSaver — figures", () => {
  it("computes spending and variance when spend matches allocation", () => {
    const r = analyseSaver({ ...base, transactions: [
      { amountCents: -20_000, createdAt: "2026-06-10T00:00:00Z", accountId: "s1", isTransfer: false },
    ]});
    expect(r.monthlySpending).toBe(20_000);
    expect(r.variance).toBe(0);
  });

  it("excludes saver-to-saver transfers from spending", () => {
    const r = analyseSaver({ ...base, transactions: [
      { amountCents: -10_000, createdAt: "2026-06-10T00:00:00Z", accountId: "s1", isTransfer: true, transferAccountId: "s2" },
    ]});
    expect(r.monthlySpending).toBe(0);
  });

  it("computes variance + variancePercentage when spending is under allocation", () => {
    const r = analyseSaver({ ...base, transactions: [
      { amountCents: -5_000, createdAt: "2026-06-10T00:00:00Z", accountId: "s1", isTransfer: false },
    ]});
    expect(r.variance).toBe(15_000); // 20_000 - 5_000
    expect(r.variancePercentage).toBe(75); // (15_000 / 20_000) * 100
  });

  it("computes negative variance when spending exceeds allocation", () => {
    const r = analyseSaver({ ...base, transactions: [
      { amountCents: -25_000, createdAt: "2026-06-10T00:00:00Z", accountId: "s1", isTransfer: false },
    ]});
    expect(r.variance).toBe(-5_000);
    expect(r.variancePercentage).toBe(-25);
  });

  it("returns 0 variancePercentage when allocation is 0 (divide-by-zero guard)", () => {
    const r = analyseSaver({
      ...base,
      account: { ...base.account, monthlyAllocationCents: 0 },
      transactions: [
        { amountCents: -3_000, createdAt: "2026-06-10T00:00:00Z", accountId: "s1", isTransfer: false },
      ],
    });
    expect(r.monthlyAllocation).toBe(0);
    expect(r.variancePercentage).toBe(0);
  });

  it("produces a 6-month history (most recent first) excluding the current month", () => {
    const r = analyseSaver({ ...base, transactions: [
      { amountCents: -4_000, createdAt: "2026-05-10T00:00:00Z", accountId: "s1", isTransfer: false },
      { amountCents: -6_000, createdAt: "2026-04-10T00:00:00Z", accountId: "s1", isTransfer: false },
    ]});
    expect(r.last6Months.map(m => m.month)).toEqual([
      "2026-05", "2026-04", "2026-03", "2026-02", "2026-01", "2025-12",
    ]);
    expect(r.last6Months[0]!).toEqual({ month: "2026-05", allocated: 20_000, spent: 4_000, variance: 16_000 });
  });

  it("averages monthly spending over the last 6 months", () => {
    const r = analyseSaver({ ...base, transactions: [
      { amountCents: -4_000, createdAt: "2026-05-10T00:00:00Z", accountId: "s1", isTransfer: false },
      { amountCents: -8_000, createdAt: "2026-04-10T00:00:00Z", accountId: "s1", isTransfer: false },
    ]});
    expect(r.averageMonthlySpending).toBe(2_000); // (4_000 + 8_000) / 6
  });
});

describe("analyseSaver — allocation source (Option A: manual wins)", () => {
  it("derives allocation from incoming transfers when no manual allocation set", () => {
    const r = analyseSaver({ ...base, transactions: [
      { amountCents: 30_000, createdAt: "2026-06-02T00:00:00Z", accountId: "s1", isTransfer: true, transferAccountId: "ext" },
      { amountCents: -10_000, createdAt: "2026-06-10T00:00:00Z", accountId: "s1", isTransfer: false },
    ]});
    expect(r.monthlyAllocation).toBe(30_000); // incoming, not the 20_000 static fallback
  });

  it("a manually-set allocation (storedAllocationCents) overrides inferred transfers", () => {
    const r = analyseSaver({
      ...base,
      storedAllocationCents: 50_000,
      transactions: [
        { amountCents: 30_000, createdAt: "2026-06-02T00:00:00Z", accountId: "s1", isTransfer: true, transferAccountId: "ext" },
      ],
    });
    expect(r.monthlyAllocation).toBe(50_000); // the explicit value wins over the 30_000 incoming
  });
});

describe("analyseSaver — goal mode (balance vs target)", () => {
  it("GOAL_MET when balance is at or above target, progress clamps to 1", () => {
    const r = analyseSaver({
      ...base,
      account: { ...base.account, balanceCents: 50_000, goalTargetCents: 40_000, goalTargetDate: "2026-12-31" },
    });
    expect(r.mode).toBe("goal");
    expect(r.status).toBe("GOAL_MET");
    expect(r.goalProgress).toBe(1);
  });

  it("BUILDING when balance is below target, with fractional progress", () => {
    const r = analyseSaver({
      ...base,
      account: { ...base.account, balanceCents: 50_000, goalTargetCents: 80_000, goalTargetDate: "2026-12-31" },
    });
    expect(r.mode).toBe("goal");
    expect(r.status).toBe("BUILDING");
    expect(r.goalProgress).toBeCloseTo(0.625); // 50_000 / 80_000
  });
});

describe("analyseSaver — envelope mode (6-month accumulation trend)", () => {
  it("BUILDING when net flow over 6 months is positive", () => {
    const r = analyseSaver({ ...base, transactions: [
      { amountCents: 10_000, createdAt: "2026-06-02T00:00:00Z", accountId: "s1", isTransfer: true, transferAccountId: "ext" },
      { amountCents: 10_000, createdAt: "2026-05-02T00:00:00Z", accountId: "s1", isTransfer: true, transferAccountId: "ext" },
    ]});
    expect(r.mode).toBe("envelope");
    expect(r.status).toBe("BUILDING");
    expect(r.goalProgress).toBeNull();
  });

  it("DRAWING_DOWN when net flow over 6 months is negative", () => {
    const r = analyseSaver({ ...base, transactions: [
      { amountCents: -30_000, createdAt: "2026-06-10T00:00:00Z", accountId: "s1", isTransfer: false },
    ]});
    expect(r.status).toBe("DRAWING_DOWN");
  });

  it("STEADY when net flow is within the dead-band (in ≈ out)", () => {
    const r = analyseSaver({ ...base, transactions: [
      { amountCents: 10_000, createdAt: "2026-06-02T00:00:00Z", accountId: "s1", isTransfer: true, transferAccountId: "ext" },
      { amountCents: -8_000, createdAt: "2026-06-10T00:00:00Z", accountId: "s1", isTransfer: false },
    ]});
    expect(r.net6MonthsCents).toBe(2_000); // within ±5_000
    expect(r.status).toBe("STEADY");
  });

  it("a sinking fund (funded monthly, spent annually) reads BUILDING, never 'overfunded'", () => {
    // $100/mo into a car-service saver across 6 months, no spend yet.
    const transactions = ["2026-06", "2026-05", "2026-04", "2026-03", "2026-02", "2026-01"].map((m) => ({
      amountCents: 10_000,
      createdAt: `${m}-02T00:00:00Z`,
      accountId: "s1",
      isTransfer: true,
      transferAccountId: "ext",
    }));
    const r = analyseSaver({ ...base, transactions });
    expect(r.status).toBe("BUILDING");
    expect(r.net6MonthsCents).toBe(60_000);
    // The old single-month model would have flagged this OVERFUNDED (variance% high).
    expect(r.variancePercentage).toBeGreaterThan(20);
  });
});

describe("analyseAllSavers", () => {
  it("analyses each saver input independently", () => {
    const inputs: SaverInput[] = [
      { ...base, account: { ...base.account, id: "s1" } },
      {
        ...base,
        account: { ...base.account, id: "s2", name: "Car", balanceCents: 10_000, goalTargetCents: 100_000, goalTargetDate: "2026-12-31" },
      },
    ];
    const results = analyseAllSavers(inputs);
    expect(results.map(r => r.saverId)).toEqual(["s1", "s2"]);
    expect(results[0]!.mode).toBe("envelope");
    expect(results[1]!.mode).toBe("goal");
    expect(results[1]!.status).toBe("BUILDING"); // 10_000 of a 100_000 goal
  });
});
