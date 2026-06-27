/**
 * Historical cashflow bucketing.
 *
 * Pure function — no DB access, no side effects.
 * Integer cents throughout. Never parseFloat a money value.
 *
 * Bucket options:
 *  "day"  — one point per calendar day (UTC) within [startISO, endISO]
 *  "week" — one point per ISO week (Monday-anchored) covering [startISO, endISO]
 *
 * Uses native Date / Date.UTC; no date-fns dependency.
 */

import type { ReportTxn } from "./salary-periods";

export interface CashflowPoint {
  date: string;         // ISO date of the bucket start ("yyyy-MM-dd")
  incomeCents: number;
  expenseCents: number; // absolute (positive) expense cents
  netCents: number;     // incomeCents - expenseCents
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return "yyyy-MM-dd" for a UTC timestamp. */
function dayKey(isoStr: string): string {
  return isoStr.slice(0, 10);
}

/** Return the UTC Date for the start of the day denoted by "yyyy-MM-dd". */
function parseDay(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * Return the Monday-anchored ISO week start ("yyyy-MM-dd") for a given date
 * string, using inline UTC math.
 */
function weekKey(isoStr: string): string {
  const d = new Date(isoStr.slice(0, 10) + "T00:00:00.000Z");
  // getUTCDay(): 0=Sun,1=Mon,...,6=Sat  →  days since Monday
  const dow = d.getUTCDay(); // 0..6
  const daysSinceMonday = dow === 0 ? 6 : dow - 1;
  const monday = new Date(d.getTime() - daysSinceMonday * 86_400_000);
  return monday.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Bucket signed transactions by day or week within [startISO, endISO] and
 * return a chronologically-ordered array of cashflow points.
 *
 * - Transfers are excluded.
 * - Uses settledAt when set, createdAt otherwise.
 * - startISO / endISO are "yyyy-MM-dd" strings (date-only; inclusive).
 */
export function buildCashflow(
  txns: ReportTxn[],
  startISO: string,
  endISO: string,
  bucket: "day" | "week",
): CashflowPoint[] {
  const startMs = parseDay(startISO).getTime();
  const endMs   = parseDay(endISO).getTime() + 86_400_000 - 1; // end of that day

  const pointMap = new Map<string, { income: number; expense: number }>();

  for (const tx of txns) {
    if (tx.isTransfer) continue;

    const dateStr = tx.settledAt ?? tx.createdAt;
    const txMs = new Date(dateStr).getTime();
    if (txMs < startMs || txMs > endMs) continue;

    const key = bucket === "day" ? dayKey(dateStr) : weekKey(dateStr);

    const entry = pointMap.get(key) ?? { income: 0, expense: 0 };
    if (tx.amountCents > 0) {
      entry.income += tx.amountCents;
    } else {
      entry.expense += Math.abs(tx.amountCents);
    }
    pointMap.set(key, entry);
  }

  return Array.from(pointMap.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, { income, expense }]) => ({
      date,
      incomeCents: income,
      expenseCents: expense,
      netCents: income - expense,
    }));
}
