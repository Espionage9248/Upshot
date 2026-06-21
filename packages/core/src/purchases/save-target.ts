import { monthsUntil } from "../budget/months";

/**
 * Computes a monthly savings rate for a wishlist item.
 *
 * Returns `{ monthlyCents: null }` when there is no target date or the date
 * has already passed (≤ now). Otherwise returns
 * `ceil(targetPriceCents / max(1, monthsUntil))` so a target this calendar
 * month always returns the full price.
 */
export function monthlySaveTarget(
  targetPriceCents: number,
  targetDate: string | null,
  now: Date,
): { monthlyCents: number | null } {
  if (targetDate === null) return { monthlyCents: null };

  const nowISO = now.toISOString().slice(0, 10);
  if (targetDate <= nowISO) return { monthlyCents: null };

  const months = Math.max(1, monthsUntil(nowISO, targetDate));
  return { monthlyCents: Math.ceil(targetPriceCents / months) };
}
