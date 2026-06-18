import { describe, it, expect } from "vitest";
import { analyseEmergencyFund, type EmergencyFundInput } from "./emergency-fund";

// avg monthly expense = 300_000 / 6 = 50_000; target = 6 × 50_000 = 300_000
const base: EmergencyFundInput = {
  account: { id: "ef1", name: "Emergency", balanceCents: 0, monthlyAllocationCents: 0 },
  // 6 complete prior months of expenses (positive cents), sums to 300_000
  monthlyExpenses: [50_000, 50_000, 50_000, 50_000, 50_000, 50_000],
  withdrawalsThisMonthCents: 0,
  inboundThisMonthCents: 0,
  outflows3MoCents: 0,
  inflows3MoCents: 0,
};

describe("analyseEmergencyFund", () => {
  it("returns null when there is no emergency account", () => {
    expect(analyseEmergencyFund({ ...base, account: null })).toBeNull();
  });

  it("computes target as 6 × average monthly expenses", () => {
    const r = analyseEmergencyFund(base)!;
    expect(r.targetBalance).toBe(300_000); // 6 × (300_000 / 6)
    expect(r.targetMonths).toBe(6);
  });

  it("caps progressPercent at 100 when balance exceeds target", () => {
    const r = analyseEmergencyFund({
      ...base,
      account: { ...base.account!, balanceCents: 600_000 },
    })!;
    expect(r.progressPercent).toBe(100);
  });

  it("computes progressPercent proportionally below target", () => {
    const r = analyseEmergencyFund({
      ...base,
      account: { ...base.account!, balanceCents: 150_000 },
    })!;
    expect(r.progressPercent).toBe(50); // round(150_000 / 300_000 × 100)
  });

  it("status GOAL_MET when balance >= target and nothing to replenish", () => {
    const r = analyseEmergencyFund({
      ...base,
      account: { ...base.account!, balanceCents: 300_000 },
    })!;
    expect(r.status).toBe("GOAL_MET");
  });

  it("status BUILDING when below target with no net withdrawal", () => {
    const r = analyseEmergencyFund({
      ...base,
      account: { ...base.account!, balanceCents: 150_000 },
    })!;
    expect(r.status).toBe("BUILDING");
  });

  it("status DEPLETED when there is an unreplaced 3-month net withdrawal", () => {
    const r = analyseEmergencyFund({
      ...base,
      account: { ...base.account!, balanceCents: 300_000 },
      outflows3MoCents: 40_000,
      inflows3MoCents: 10_000,
    })!;
    expect(r.replenishmentNeeded).toBe(30_000);
    expect(r.status).toBe("DEPLETED");
  });

  it("topUpNeeded = max(0, target - balance)", () => {
    const under = analyseEmergencyFund({
      ...base,
      account: { ...base.account!, balanceCents: 120_000 },
    })!;
    expect(under.topUpNeeded).toBe(180_000); // 300_000 - 120_000

    const over = analyseEmergencyFund({
      ...base,
      account: { ...base.account!, balanceCents: 400_000 },
    })!;
    expect(over.topUpNeeded).toBe(0);
  });

  it("replenishmentNeeded = max(0, outflows3Mo - inflows3Mo), floored at 0", () => {
    const r = analyseEmergencyFund({
      ...base,
      outflows3MoCents: 20_000,
      inflows3MoCents: 50_000,
    })!;
    expect(r.replenishmentNeeded).toBe(0);
  });

  it("savingsOnTrack is false when allocation is 0", () => {
    const r = analyseEmergencyFund({
      ...base,
      account: { ...base.account!, monthlyAllocationCents: 0 },
      inboundThisMonthCents: 100_000,
    })!;
    expect(r.savingsOnTrack).toBe(false);
  });

  it("savingsOnTrack true when inbound meets a positive allocation", () => {
    const r = analyseEmergencyFund({
      ...base,
      account: { ...base.account!, monthlyAllocationCents: 50_000 },
      inboundThisMonthCents: 50_000,
    })!;
    expect(r.savingsOnTrack).toBe(true);
    expect(r.savingsShortfallThisMonth).toBe(0);
  });

  it("savingsShortfallThisMonth = max(0, allocation - inbound)", () => {
    const r = analyseEmergencyFund({
      ...base,
      account: { ...base.account!, monthlyAllocationCents: 50_000 },
      inboundThisMonthCents: 30_000,
    })!;
    expect(r.savingsShortfallThisMonth).toBe(20_000);
    expect(r.savingsOnTrack).toBe(false);
  });

  describe("readinessScore tiers (monthsCovered = balance / avgMonthlyExpenses; avg = 50_000)", () => {
    it("0 / critical when balance is 0", () => {
      const r = analyseEmergencyFund({ ...base, account: { ...base.account!, balanceCents: 0 } })!;
      expect(r.readinessScore).toBe(0);
      expect(r.readinessTier).toBe("critical");
    });

    it("< 1 month: score = round(monthsCovered × 25), critical", () => {
      // 25_000 / 50_000 = 0.5 months → round(0.5 × 25) = 13
      const r = analyseEmergencyFund({ ...base, account: { ...base.account!, balanceCents: 25_000 } })!;
      expect(r.readinessScore).toBe(13);
      expect(r.readinessTier).toBe("critical");
    });

    it("1–3 months: score = round(25 + ((m-1)/2)×40), building", () => {
      // 100_000 / 50_000 = 2 months → round(25 + (1/2)×40) = 45
      const r = analyseEmergencyFund({ ...base, account: { ...base.account!, balanceCents: 100_000 } })!;
      expect(r.readinessScore).toBe(45);
      expect(r.readinessTier).toBe("building");
    });

    it("3–6 months: score = round(65 + ((m-3)/3)×25), good", () => {
      // 200_000 / 50_000 = 4 months → round(65 + (1/3)×25) = 73
      const r = analyseEmergencyFund({ ...base, account: { ...base.account!, balanceCents: 200_000 } })!;
      expect(r.readinessScore).toBe(73);
      expect(r.readinessTier).toBe("good");
    });

    it(">= 6 months: score = 100, excellent", () => {
      // 300_000 / 50_000 = 6 months → 100
      const r = analyseEmergencyFund({ ...base, account: { ...base.account!, balanceCents: 300_000 } })!;
      expect(r.readinessScore).toBe(100);
      expect(r.readinessTier).toBe("excellent");
    });
  });

  it("guards divide-by-zero when there is no expense history", () => {
    const r = analyseEmergencyFund({
      ...base,
      monthlyExpenses: [],
      account: { ...base.account!, balanceCents: 100_000 },
    })!;
    expect(r.targetBalance).toBe(0);
    expect(r.progressPercent).toBe(0);
    expect(r.readinessScore).toBe(0);
  });
});
