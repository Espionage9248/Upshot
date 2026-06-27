// packages/core/src/scenarios/salary-change.ts
import { simulatePayoff, orderByStrategy } from "../payoff";
import type { PayoffDebtInput } from "../payoff";
import type {
  SalaryChangeInput,
  SalaryChangeResult,
  DebtPayoffImpact,
  AllocationSuggestion,
} from "./types";

export function simulateSalaryChange(input: SalaryChangeInput): SalaryChangeResult {
  const {
    currentMonthlyIncomeCents: cur,
    newMonthlyIncomeCents: next,
    monthlyExpensesCents,
    monthlyExplicitSavingsCents,
    hasExplicitSavingsAccounts,
    debts,
    debtStrategy,
    customOrder,
    savers,
    startMonth,
  } = input;

  const incomeChangeCents = next - cur;
  const incomeChangePct = cur > 0 ? (incomeChangeCents / cur) * 100 : 0;

  const totalMonthlyDebtCents = debts.reduce((s, d) => s + d.minimumPaymentCents, 0);

  const currentSavingsRate = cur > 0
    ? Math.max(0, ((hasExplicitSavingsAccounts
        ? monthlyExplicitSavingsCents
        : Math.max(0, cur - monthlyExpensesCents - totalMonthlyDebtCents)) / cur) * 100)
    : 0;

  const projectedExplicit = cur > 0 && hasExplicitSavingsAccounts
    ? Math.round(monthlyExplicitSavingsCents * (next / cur))
    : Math.max(0, next - monthlyExpensesCents - totalMonthlyDebtCents);
  const projectedSavingsRate = next > 0 ? Math.max(0, (projectedExplicit / next) * 100) : 0;

  const currentDTI = cur > 0 ? (totalMonthlyDebtCents / cur) * 100 : 0;
  const projectedDTI = next > 0 ? (totalMonthlyDebtCents / next) * 100 : 0;

  let debtPayoffImpact: DebtPayoffImpact | null = null;
  if (incomeChangeCents > 0 && debts.length > 0) {
    const payoffDebts: PayoffDebtInput[] = debts.map((d) => ({
      id: d.id,
      currentBalanceCents: d.currentBalanceCents,
      minimumPaymentCents: d.minimumPaymentCents,
      interestRate: d.interestRate,
    }));
    const order = debtStrategy === "CUSTOM" && customOrder
      ? customOrder
      : orderByStrategy(payoffDebts, debtStrategy);
    const baseRes = simulatePayoff({
      debts: payoffDebts, order, startMonth, extraSchedule: [], lumpSums: [],
    });
    const projRes = simulatePayoff({
      debts: payoffDebts, order, startMonth,
      extraSchedule: [{ fromMonth: startMonth, extraCents: incomeChangeCents }],
      lumpSums: [],
    });
    debtPayoffImpact = {
      monthsSaved: Math.max(0, baseRes.monthsToPayoff - projRes.monthsToPayoff),
      interestSavedCents: Math.max(0, baseRes.totalInterestCents - projRes.totalInterestCents),
      newDebtFreeMonth: projRes.debtFreeMonth,
    };
  }

  const scale = cur > 0 ? next / cur : 1;
  const allocationSuggestions: AllocationSuggestion[] = savers
    .filter((s) => s.monthlyAllocationCents > 0)
    .map((s) => {
      const suggested = Math.round(s.monthlyAllocationCents * scale);
      return {
        saverId: s.saverId,
        saverName: s.saverName,
        currentAllocationCents: s.monthlyAllocationCents,
        suggestedAllocationCents: suggested,
        changeCents: suggested - s.monthlyAllocationCents,
        changePct: s.monthlyAllocationCents > 0
          ? ((suggested - s.monthlyAllocationCents) / s.monthlyAllocationCents) * 100
          : 0,
      };
    });

  return {
    currentIncomeCents: cur,
    newIncomeCents: next,
    incomeChangeCents,
    incomeChangePct,
    currentSavingsRate,
    projectedSavingsRate,
    currentDTI,
    projectedDTI,
    additionalMonthlyFreedomCents: incomeChangeCents,
    debtPayoffImpact,
    allocationSuggestions,
  };
}
