/**
 * Month-over-month delta helpers.
 *
 * Pure functions — no DB access, no side effects.
 * Integer cents in; only changePct is a ratio float.
 */

// ---------------------------------------------------------------------------
// Exported interfaces
// ---------------------------------------------------------------------------

export interface MoMDelta {
  changePct: number | null;
  direction: "up" | "down" | "flat";
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/**
 * Compute a month-over-month delta between two integer-cent values.
 *
 * `changePct` is null when `previousCents === 0` (no baseline to divide by).
 * `direction` is "up" when changePct > 0, "down" when < 0, "flat" otherwise
 * (including the null case).
 */
export function momDelta(currentCents: number, previousCents: number): MoMDelta {
  if (previousCents === 0) {
    return { changePct: null, direction: "flat" };
  }
  const changePct = ((currentCents - previousCents) / previousCents) * 100;
  const direction: MoMDelta["direction"] =
    changePct > 0 ? "up" : changePct < 0 ? "down" : "flat";
  return { changePct, direction };
}
