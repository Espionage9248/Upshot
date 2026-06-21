import { describe, it, expect } from "vitest";
import { solveExtraForTargetDate } from "./solve";
import { simulatePayoff } from "./simulate";
import type { PayoffInputs } from "./types";

const base: Omit<PayoffInputs, "extraSchedule"> = {
  debts: [{ id: "a", currentBalanceCents: 120000, minimumPaymentCents: 5000, interestRate: 0.12 }],
  order: ["a"],
  startMonth: "2026-07",
  lumpSums: [],
};

describe("solveExtraForTargetDate", () => {
  it("finds an extra that hits the target month", () => {
    const target = "2027-07"; // 12 months out
    const { extraCents, achievable } = solveExtraForTargetDate(base, target);
    expect(achievable).toBe(true);
    const r = simulatePayoff({ ...base, extraSchedule: [{ fromMonth: base.startMonth, extraCents }] });
    expect(r.debtFreeMonth).not.toBeNull();
    expect(r.debtFreeMonth! <= target).toBe(true);
  });

  it("reports unachievable when the target is sooner than any payoff", () => {
    const { achievable } = solveExtraForTargetDate(base, "2026-07"); // can't clear 120000 in 1 month at 5000 min
    // Even huge extra clears in ~1 month = 2026-07, so this is the boundary; use a past month to be safe:
    const past = solveExtraForTargetDate(base, "2026-06");
    expect(past.achievable).toBe(false);
    expect(achievable).toBe(true); // clearing within the start month itself IS achievable with enough extra
  });

  it("returns a non-negative integer extra", () => {
    const { extraCents } = solveExtraForTargetDate(base, "2028-01");
    expect(Number.isInteger(extraCents)).toBe(true);
    expect(extraCents).toBeGreaterThanOrEqual(0);
  });
});
