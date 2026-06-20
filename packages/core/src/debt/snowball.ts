import { addMonths, monthsBetween } from "./months";
import type {
  DebtInput,
  DebtStrategy,
  MonthlyPayment,
  PayoffSchedule,
  SnowballAnalysis,
} from "./types";

const MAX_MONTHS = 600;

function sortDebtsByStrategy(
  debts: DebtInput[],
  strategy: DebtStrategy,
  customOrder?: string[],
): DebtInput[] {
  switch (strategy) {
    case "SNOWBALL":
      // Smallest balance first
      return [...debts].sort((a, b) => a.currentBalanceCents - b.currentBalanceCents);

    case "AVALANCHE":
      // Highest interest rate first
      return [...debts].sort((a, b) => (b.interestRate ?? 0) - (a.interestRate ?? 0));

    case "CUSTOM":
      if (customOrder && customOrder.length > 0) {
        const orderMap = new Map(customOrder.map((id, idx) => [id, idx]));
        return [...debts].sort((a, b) => {
          const ai = orderMap.get(a.id) ?? 999;
          const bi = orderMap.get(b.id) ?? 999;
          return ai - bi;
        });
      }
      // Fall back to stored payoffPriority
      return [...debts].sort((a, b) => a.payoffPriority - b.payoffPriority);

    default:
      return [...debts];
  }
}

function calculateSingleDebtPayoff(
  debt: DebtInput,
  extraPaymentCents: number,
  startMonth: string,
): PayoffSchedule {
  let balanceCents = debt.currentBalanceCents;
  let totalPaidCents = 0;
  let totalInterestCents = 0;
  const monthlyBreakdown: MonthlyPayment[] = [];
  let currentMonth = startMonth;
  const paymentCents = debt.monthlyPaymentCents + extraPaymentCents;

  while (balanceCents > 0 && monthlyBreakdown.length < MAX_MONTHS) {
    const interestCents = Math.round(balanceCents * (debt.interestRate ?? 0) / 12);

    let principalCents: number;
    let actualPaymentCents: number;

    if (balanceCents <= paymentCents - interestCents) {
      // Final month: pay off exactly
      principalCents = balanceCents;
      actualPaymentCents = principalCents + interestCents;
    } else {
      principalCents = paymentCents - interestCents;
      actualPaymentCents = paymentCents;
    }

    balanceCents -= principalCents;
    totalInterestCents += interestCents;
    totalPaidCents += actualPaymentCents;

    monthlyBreakdown.push({
      month: currentMonth,
      paymentCents: actualPaymentCents,
      principalCents,
      interestCents,
      remainingBalanceCents: balanceCents,
    });

    currentMonth = addMonths(currentMonth, 1);
  }

  return {
    debtId: debt.id,
    debtName: debt.name,
    payoffMonth: monthlyBreakdown.length > 0
      ? monthlyBreakdown.at(-1)!.month
      : startMonth,
    totalPaidCents,
    totalInterestCents,
    monthlyBreakdown,
  };
}

export function computeSnowball(
  debts: DebtInput[],
  opts: {
    strategy: DebtStrategy;
    extraPaymentCents: number;
    startMonth: string;
    customOrder?: string[];
  },
): SnowballAnalysis {
  const eligible = debts.filter((d) => d.includeInSnowball);

  if (eligible.length === 0) {
    return {
      strategy: opts.strategy,
      totalMonthlyPaymentCents: 0,
      monthsToPayoff: 0,
      debtFreeMonth: null,
      totalInterestPaidCents: 0,
      payoffOrder: [],
      schedules: [],
    };
  }

  const sorted = sortDebtsByStrategy(eligible, opts.strategy, opts.customOrder);
  const schedules: PayoffSchedule[] = [];
  let availableExtraCents = opts.extraPaymentCents;
  let currentStartMonth = opts.startMonth;

  for (const debt of sorted) {
    const debtWithExtra: DebtInput = {
      ...debt,
      monthlyPaymentCents: debt.monthlyPaymentCents,
    };
    const schedule = calculateSingleDebtPayoff(
      debtWithExtra,
      availableExtraCents,
      currentStartMonth,
    );
    schedules.push(schedule);

    // Cascade: freed payment rolls into next debt
    availableExtraCents += debt.monthlyPaymentCents;
    // Next debt starts at the month AFTER this debt's last payment
    if (schedule.monthlyBreakdown.length > 0) {
      currentStartMonth = addMonths(schedule.payoffMonth, 1);
    }
  }

  const totalInterestPaidCents = schedules.reduce(
    (sum, s) => sum + s.totalInterestCents,
    0,
  );

  const totalMonthlyPaymentCents =
    eligible.reduce((sum, d) => sum + d.monthlyPaymentCents, 0) +
    opts.extraPaymentCents;

  // debtFreeMonth = the payoffMonth of the last schedule
  const debtFreeMonth =
    schedules.length > 0 ? schedules.at(-1)!.payoffMonth : null;

  const monthsToPayoff = debtFreeMonth
    ? monthsBetween(opts.startMonth, debtFreeMonth)
    : 0;

  return {
    strategy: opts.strategy,
    totalMonthlyPaymentCents,
    monthsToPayoff,
    debtFreeMonth,
    totalInterestPaidCents,
    payoffOrder: sorted.map((d) => d.id),
    schedules,
  };
}

export function computeWhatIf(
  debts: DebtInput[],
  opts: {
    strategy: DebtStrategy;
    extraPaymentCents: number;
    startMonth: string;
  },
): {
  withExtra: SnowballAnalysis;
  base: SnowballAnalysis;
  monthsSaved: number;
  interestSavedCents: number;
} {
  const base = computeSnowball(debts, { ...opts, extraPaymentCents: 0 });
  const withExtra = computeSnowball(debts, opts);
  return {
    withExtra,
    base,
    monthsSaved: Math.max(0, base.monthsToPayoff - withExtra.monthsToPayoff),
    interestSavedCents: Math.max(
      0,
      base.totalInterestPaidCents - withExtra.totalInterestPaidCents,
    ),
  };
}
