import { addMonths, monthsBetween } from "../debt/months";
import type { PayoffInputs, PayoffResult } from "./types";

const MAX_MONTHS = 600;

/** First id in `order` whose balance is still positive, else null. */
function firstUnpaid(order: string[], balances: Map<string, number>): string | null {
  for (const id of order) {
    if ((balances.get(id) ?? 0) > 0) return id;
  }
  return null;
}

/**
 * Global month-by-month payoff simulation.
 * Supports stepped extra (income raise) and one-off lump sums.
 * Existing computeSnowball is intentionally left untouched.
 */
export function simulatePayoff(inputs: PayoffInputs): PayoffResult {
  const { debts, order, startMonth, extraSchedule, lumpSums } = inputs;

  const balances = new Map(debts.map((d) => [d.id, d.currentBalanceCents]));
  const steps = [...extraSchedule].sort((a, b) => (a.fromMonth < b.fromMonth ? -1 : 1));
  const curve: { month: string; balanceCents: number }[] = [];
  const clearedMonth = new Map<string, string>();
  let totalInterestCents = 0;
  let month = startMonth;
  let monthsElapsed = 0;

  const totalBalance = (): number => {
    let t = 0;
    for (const v of balances.values()) t += v;
    return t;
  };

  const extraForMonth = (m: string): number => {
    let e = 0;
    for (const s of steps) if (s.fromMonth <= m) e = s.extraCents; // latest applicable wins
    return e;
  };

  while (totalBalance() > 0 && monthsElapsed < MAX_MONTHS) {
    // 1. Cascade: minimums of already-dead debts join this month's pool.
    let pool = extraForMonth(month);
    for (const d of debts) {
      if ((balances.get(d.id) ?? 0) <= 0) pool += d.minimumPaymentCents;
    }

    // 2. Interest + minimum on each live debt.
    for (const d of debts) {
      let bal = balances.get(d.id) ?? 0;
      if (bal <= 0) continue;
      const interest = Math.round((bal * (d.interestRate ?? 0)) / 12);
      bal += interest;
      totalInterestCents += interest;
      const minPay = Math.min(d.minimumPaymentCents, bal);
      bal -= minPay;
      balances.set(d.id, bal);
    }

    // 3. Lump sums scheduled this month.
    for (const l of lumpSums) {
      if (l.month !== month) continue;
      const targetId = l.targetDebtId ?? firstUnpaid(order, balances);
      if (targetId == null) continue;
      const bal = balances.get(targetId) ?? 0;
      balances.set(targetId, Math.max(0, bal - l.amountCents));
    }

    // 4. Pour the pool down the priority order onto live debts.
    for (const id of order) {
      if (pool <= 0) break;
      const bal = balances.get(id) ?? 0;
      if (bal <= 0) continue;
      const pay = Math.min(pool, bal);
      balances.set(id, bal - pay);
      pool -= pay;
    }

    // Record the month each debt first reaches zero (after this month's payments).
    for (const d of debts) {
      if (!clearedMonth.has(d.id) && (balances.get(d.id) ?? 0) <= 0) {
        clearedMonth.set(d.id, month);
      }
    }

    curve.push({ month, balanceCents: totalBalance() });
    month = addMonths(month, 1);
    monthsElapsed += 1;
  }

  const cleared = totalBalance() <= 0 && curve.length > 0;
  const debtFreeMonth = cleared ? curve.at(-1)!.month : null;

  return {
    debtFreeMonth,
    monthsToPayoff: debtFreeMonth ? monthsBetween(startMonth, debtFreeMonth) : monthsElapsed,
    totalInterestCents,
    curve,
    perDebt: debts.map((d) => ({ id: d.id, clearedMonth: clearedMonth.get(d.id) ?? null })),
  };
}
