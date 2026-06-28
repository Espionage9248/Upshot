/**
 * Australian resident individual income tax — progressive bracket math.
 *
 * Pure, integer-cents. The only floats are the marginal RATES (basis points are
 * integers; the multiply uses the rate as a fraction then rounds back to cents).
 *
 * `fy` is the financial-year ENDING year: 2026 = FY2025-26 (1 Jul 2025–30 Jun
 * 2026). To add FY2027 (the 16% band drops to 15% from 1 Jul 2026), add a row
 * to BRACKETS — no other code changes.
 *
 * Brackets exclude the 2% Medicare levy and any offsets (LITO) — those are
 * applied in estimate.ts.
 */

/** One bracket: income at/above `fromCents` is taxed at `rateBps` on the excess. */
interface Bracket {
  fromCents: number;
  rateBps: number; // basis points: 16% = 1600
}

/** Resident brackets by FY ending year. Thresholds in integer cents. */
const BRACKETS: Record<number, readonly Bracket[]> = {
  2026: [
    { fromCents: 0, rateBps: 0 },
    { fromCents: 1_820_000, rateBps: 1600 },   // $18,200
    { fromCents: 4_500_000, rateBps: 3000 },   // $45,000
    { fromCents: 13_500_000, rateBps: 3700 },  // $135,000
    { fromCents: 19_000_000, rateBps: 4500 },  // $190,000
  ],
};

export const SUPPORTED_FYS: readonly number[] = Object.keys(BRACKETS).map(Number);

function bracketsFor(fy: number): readonly Bracket[] {
  const b = BRACKETS[fy];
  if (!b) throw new RangeError(`No tax brackets for FY${fy}`);
  return b;
}

/** Progressive resident income tax (excl. Medicare/LITO), integer cents. */
export function incomeTaxCents(taxableIncomeCents: number, fy: number): number {
  const brackets = bracketsFor(fy);
  if (taxableIncomeCents <= 0) return 0;

  let taxCents = 0;
  for (let i = 0; i < brackets.length; i++) {
    const band = brackets[i]!;
    if (taxableIncomeCents <= band.fromCents) break;
    const next = brackets[i + 1];
    const upper = next ? Math.min(taxableIncomeCents, next.fromCents) : taxableIncomeCents;
    const slabCents = upper - band.fromCents;
    taxCents += (slabCents * band.rateBps) / 10_000;
  }
  return Math.round(taxCents);
}

/** Marginal rate (basis points) at the given income. */
export function marginalRateBps(taxableIncomeCents: number, fy: number): number {
  const brackets = bracketsFor(fy);
  let rate = 0;
  for (const band of brackets) {
    if (taxableIncomeCents > band.fromCents) rate = band.rateBps;
    else break;
  }
  return rate;
}
