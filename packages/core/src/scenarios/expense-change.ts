import type {
  ExpenseChangeInput,
  ExpenseChangeResult,
  ExpenseAdjustmentResult,
} from "./types";

export function simulateExpenseChange(input: ExpenseChangeInput): ExpenseChangeResult {
  const {
    currentIncomeCents: income,
    savers,
    adjustments,
    totalMonthlyDebtCents,
    monthlyExplicitSavingsCents,
    hasExplicitSavingsAccounts,
  } = input;

  const adjMap = new Map(adjustments.map((a) => [a.saverId, a.newAllocationCents]));

  const adjResults: ExpenseAdjustmentResult[] = savers.map((s) => {
    const newAlloc = adjMap.has(s.saverId) ? adjMap.get(s.saverId)! : s.monthlyAllocationCents;
    return {
      saverId: s.saverId,
      saverName: s.saverName,
      currentAllocationCents: s.monthlyAllocationCents,
      newAllocationCents: newAlloc,
      changeCents: newAlloc - s.monthlyAllocationCents,
    };
  });

  const currentTotalAllocatedCents = savers.reduce((sum, s) => sum + s.monthlyAllocationCents, 0);
  const newTotalAllocatedCents = adjResults.reduce((sum, a) => sum + a.newAllocationCents, 0);
  const allocationChangeCents = newTotalAllocatedCents - currentTotalAllocatedCents;

  const currentSavingsRate = income > 0
    ? Math.max(0, ((hasExplicitSavingsAccounts
        ? monthlyExplicitSavingsCents
        : Math.max(0, income - currentTotalAllocatedCents - totalMonthlyDebtCents)) / income) * 100)
    : 0;
  const projectedSavingsRate = income > 0
    ? Math.max(0, ((hasExplicitSavingsAccounts
        ? monthlyExplicitSavingsCents
        : Math.max(0, income - newTotalAllocatedCents - totalMonthlyDebtCents)) / income) * 100)
    : 0;

  const monthlyImpactCents = -allocationChangeCents; // reduced allocation = freed savings
  const yearlyImpactCents = monthlyImpactCents * 12;

  return {
    adjustments: adjResults,
    currentTotalAllocatedCents,
    newTotalAllocatedCents,
    allocationChangeCents,
    currentSavingsRate,
    projectedSavingsRate,
    monthlyImpactCents,
    yearlyImpactCents,
  };
}
