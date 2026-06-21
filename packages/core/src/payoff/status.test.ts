import { describe, it, expect } from "vitest";
import { headroomCents } from "./headroom";
import { evaluatePlanStatus } from "./status";

describe("headroomCents", () => {
  it("subtracts expenses and minimums from income", () => {
    expect(headroomCents(500000, 300000, 50000)).toBe(150000);
  });
  it("can go negative", () => {
    expect(headroomCents(100000, 300000, 50000)).toBe(-250000);
  });
});

describe("evaluatePlanStatus", () => {
  const baseArgs = {
    expectedBalanceCents: 100000,
    currentBalanceCents: 100000,
    projectedDebtFreeMonth: "2027-07",
    recomputedDebtFreeMonth: "2027-07",
    committedThisMonthCents: 50000,
    actualPaidThisMonthCents: 50000,
    toleranceCents: 1000,
  };

  it("on-track when current balance matches expected within tolerance", () => {
    expect(evaluatePlanStatus(baseArgs).status).toBe("on-track");
  });

  it("ahead when current balance is below expected beyond tolerance", () => {
    const r = evaluatePlanStatus({ ...baseArgs, currentBalanceCents: 90000 });
    expect(r.status).toBe("ahead");
    expect(r.balanceGapCents).toBe(10000); // expected − current
  });

  it("behind when current balance exceeds expected beyond tolerance", () => {
    const r = evaluatePlanStatus({ ...baseArgs, currentBalanceCents: 110000 });
    expect(r.status).toBe("behind");
    expect(r.balanceGapCents).toBe(-10000);
  });

  it("balances-behind wins even when contributions were paid in full", () => {
    const r = evaluatePlanStatus({ ...baseArgs, currentBalanceCents: 120000, actualPaidThisMonthCents: 50000 });
    expect(r.status).toBe("behind");
    expect(r.contributionsShortfallCents).toBe(0);
  });

  it("a contributions shortfall does not flip an on-track outcome to behind", () => {
    const r = evaluatePlanStatus({ ...baseArgs, actualPaidThisMonthCents: 20000 });
    expect(r.status).toBe("on-track");
    expect(r.contributionsShortfallCents).toBe(30000);
  });

  it("reports negative slip when recomputed is earlier than projected", () => {
    const r = evaluatePlanStatus({ ...baseArgs, recomputedDebtFreeMonth: "2027-04" });
    expect(r.slipMonths).toBe(-3);
  });

  it("reports positive slip when recomputed is later than projected", () => {
    const r = evaluatePlanStatus({ ...baseArgs, recomputedDebtFreeMonth: "2027-10" });
    expect(r.slipMonths).toBe(3);
  });
});
