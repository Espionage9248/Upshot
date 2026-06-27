import { describe, it, expect } from "vitest";
import { simulateExpenseChange } from "./expense-change";
import type { ExpenseChangeInput } from "./types";

const base: ExpenseChangeInput = {
  currentIncomeCents: 5000_00,
  savers: [
    { saverId: "s1", saverName: "Holiday", monthlyAllocationCents: 300_00 },
    { saverId: "s2", saverName: "Car", monthlyAllocationCents: 200_00 },
  ],
  adjustments: [{ saverId: "s1", newAllocationCents: 100_00 }],
  totalMonthlyDebtCents: 100_00,
  monthlyExplicitSavingsCents: 0,
  hasExplicitSavingsAccounts: false,
};

describe("simulateExpenseChange", () => {
  it("applies adjustments, leaves others unchanged", () => {
    const r = simulateExpenseChange(base);
    expect(r.currentTotalAllocatedCents).toBe(500_00);
    expect(r.newTotalAllocatedCents).toBe(300_00); // 100 + 200
    expect(r.allocationChangeCents).toBe(-200_00);
  });

  it("reducing allocation increases monthly + yearly savings impact", () => {
    const r = simulateExpenseChange(base);
    expect(r.monthlyImpactCents).toBe(200_00);     // -allocationChange
    expect(r.yearlyImpactCents).toBe(2400_00);
  });

  it("projected savings-rate (residual) rises when allocations fall", () => {
    const r = simulateExpenseChange(base);
    // current residual = 5000 - 500 - 100 = 4400 → 88%
    expect(r.currentSavingsRate).toBeCloseTo(88, 5);
    // projected residual = 5000 - 300 - 100 = 4600 → 92%
    expect(r.projectedSavingsRate).toBeCloseTo(92, 5);
  });

  it("explicit-savings mode holds savings constant across adjustments", () => {
    const r = simulateExpenseChange({ ...base, hasExplicitSavingsAccounts: true, monthlyExplicitSavingsCents: 500_00 });
    expect(r.currentSavingsRate).toBeCloseTo(10, 5);
    expect(r.projectedSavingsRate).toBeCloseTo(10, 5);
  });
});
