import { simulatePayoff } from "./simulate";
import type { PayoffInputs } from "./types";

/**
 * Binary-search the smallest constant extra payment whose payoff date is on or
 * before `targetMonth`. `achievable` is false when even clearing everything at
 * once can't reach the target (the target is earlier than the minimum payoff).
 */
export function solveExtraForTargetDate(
  base: Omit<PayoffInputs, "extraSchedule">,
  targetMonth: string,
): { extraCents: number; achievable: boolean } {
  const totalBalance = base.debts.reduce((s, d) => s + d.currentBalanceCents, 0);

  const debtFreeAt = (extraCents: number): string | null =>
    simulatePayoff({ ...base, extraSchedule: [{ fromMonth: base.startMonth, extraCents }] }).debtFreeMonth;

  // Upper bound: paying the whole balance as extra clears in the first month.
  const hiMonth = debtFreeAt(totalBalance);
  if (hiMonth == null || hiMonth > targetMonth) {
    return { extraCents: totalBalance, achievable: false };
  }

  let lo = 0;
  let hi = totalBalance;
  for (let i = 0; i < 40 && hi - lo > 1; i += 1) {
    const mid = Math.floor((lo + hi) / 2);
    const m = debtFreeAt(mid);
    if (m != null && m <= targetMonth) hi = mid;
    else lo = mid;
  }
  return { extraCents: hi, achievable: true };
}
