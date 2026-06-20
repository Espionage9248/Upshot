export interface FeeAccrualInput {
  monthlyFeeCents: number | null;
  feeDueDay: number | null;
  lastFeeAppliedAt: string | null;
  currentBalanceCents: number;
}

/**
 * Pure function. Returns the new balance and timestamp to persist if a monthly
 * fee is due and has not already been applied in the current calendar month.
 * Returns null if no fee should be applied.
 *
 * Idempotency guard: compares lastFeeAppliedAt yyyy-MM against now's yyyy-MM.
 * Integer cents only — no floating-point arithmetic.
 */
export function accrueFee(
  debt: FeeAccrualInput,
  now: string /* ISO */,
): { newBalanceCents: number; lastFeeAppliedAt: string } | null {
  if (debt.monthlyFeeCents == null || debt.feeDueDay == null) return null;

  const nowDate = new Date(now);
  if (nowDate.getUTCDate() < debt.feeDueDay) return null;

  const nowMonth = now.slice(0, 7); // "yyyy-MM"
  if (debt.lastFeeAppliedAt != null && debt.lastFeeAppliedAt.slice(0, 7) === nowMonth) return null;

  return {
    newBalanceCents: debt.currentBalanceCents + debt.monthlyFeeCents,
    lastFeeAppliedAt: now,
  };
}
