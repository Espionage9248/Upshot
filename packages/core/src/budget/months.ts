/**
 * Whole months from `fromISO` to `toISO`, partial months rounded UP (ceil).
 * Both args are `YYYY-MM-DD` (date only). Returns 0 when `toISO <= fromISO`
 * (never negative) — e.g. an already-past goal date is "0 months away".
 *
 * "Whole month" is calendar-anchored: from the 20th to the 20th N months later
 * is exactly N; any extra days bump the count up by one.
 */
export function monthsUntil(fromISO: string, toISO: string): number {
  if (toISO <= fromISO) return 0;

  const [fy, fm, fd] = fromISO.split("-").map(Number) as [number, number, number];
  const [ty, tm, td] = toISO.split("-").map(Number) as [number, number, number];

  let months = (ty - fy) * 12 + (tm - fm);
  // If we haven't yet reached the day-of-month anchor, the final month is partial
  // — ceil bumps the count up by one.
  if (td > fd) months += 1;
  return months;
}
