// packages/core/src/scenarios/salary-change.test.ts
import { describe, it, expect } from "vitest";
import { simulateSalaryChange } from "./salary-change";
import type { SalaryChangeInput } from "./types";

const base: SalaryChangeInput = {
  currentMonthlyIncomeCents: 5000_00,
  newMonthlyIncomeCents: 6000_00,
  monthlyExpensesCents: 3000_00,
  monthlyExplicitSavingsCents: 1000_00,
  hasExplicitSavingsAccounts: true,
  debts: [{ id: "d1", currentBalanceCents: 2000_00, minimumPaymentCents: 100_00, interestRate: 0.2 }],
  debtStrategy: "SNOWBALL",
  savers: [{ saverId: "s1", saverName: "Holiday", monthlyAllocationCents: 200_00 }],
  startMonth: "2026-06",
};

describe("simulateSalaryChange", () => {
  it("computes income change + percent", () => {
    const r = simulateSalaryChange(base);
    expect(r.incomeChangeCents).toBe(1000_00);
    expect(r.incomeChangePct).toBeCloseTo(20, 5);
    expect(r.additionalMonthlyFreedomCents).toBe(1000_00);
  });

  it("scales explicit savings proportionally to new income for projected rate", () => {
    const r = simulateSalaryChange(base);
    // current: 1000/5000 = 20%
    expect(r.currentSavingsRate).toBeCloseTo(20, 5);
    // projected explicit savings = 1000 * (6000/5000) = 1200 → 1200/6000 = 20%
    expect(r.projectedSavingsRate).toBeCloseTo(20, 5);
  });

  it("DTI falls as income rises (payment fixed)", () => {
    const r = simulateSalaryChange(base);
    expect(r.currentDTI).toBeCloseTo(2, 5);   // 100/5000
    expect(r.projectedDTI).toBeLessThan(r.currentDTI);
  });

  it("suggests scaled allocations", () => {
    const r = simulateSalaryChange(base);
    const s = r.allocationSuggestions[0]!;
    expect(s.suggestedAllocationCents).toBe(Math.round(200_00 * (6000_00 / 5000_00))); // 240_00
    expect(s.changeCents).toBe(40_00);
  });

  it("returns a debt-payoff impact when income rises and debts exist", () => {
    const r = simulateSalaryChange(base);
    expect(r.debtPayoffImpact).not.toBeNull();
    expect(r.debtPayoffImpact!.monthsSaved).toBeGreaterThanOrEqual(0);
    expect(r.debtPayoffImpact!.interestSavedCents).toBeGreaterThanOrEqual(0);
  });

  it("no debt impact when income does not rise", () => {
    const r = simulateSalaryChange({ ...base, newMonthlyIncomeCents: 5000_00 });
    expect(r.debtPayoffImpact).toBeNull();
  });

  it("residual savings-rate fallback when no explicit savings accounts", () => {
    const r = simulateSalaryChange({ ...base, hasExplicitSavingsAccounts: false });
    // current residual = 5000 - 3000 - 100(debt min) = 1900 → 38%
    expect(r.currentSavingsRate).toBeCloseTo(38, 5);
  });
});
