/**
 * Yearly and AU financial-year reports.
 *
 * Pure function — no DB access, no side effects.
 * Integer cents throughout. Never parseFloat a money value.
 * Only savingsRate and *ChangePct are ratio/percentage floats.
 *
 * AU Financial Year: 1 July → 30 June, labelled by its ending year.
 *   FY2026 = 1 Jul 2025 → 30 Jun 2026
 */

import type { ReportTxn } from "./salary-periods";
import type { CategoryBreakdownItem } from "./category-breakdown";
import { buildCategoryBreakdown } from "./category-breakdown";
import type { Insight } from "./monthly";

// ---------------------------------------------------------------------------
// Exported interfaces
// ---------------------------------------------------------------------------

export interface YearlyMonth {
  month: string;           // "yyyy-MM"
  incomeCents: number;
  expensesCents: number;
  netCents: number;
  savingsRate: number;     // ratio float, 0..1
}

export interface YearlyReport {
  year: number;
  isPartialYear: boolean;
  totalIncomeCents: number;
  totalExpensesCents: number;
  netCents: number;
  averageMonthlyIncomeCents: number;
  averageMonthlyExpensesCents: number;
  monthlyBreakdown: YearlyMonth[];
  categoryBreakdown: CategoryBreakdownItem[];
  insights: Insight[];
  previousYearComparison: {
    incomeChangePct: number;
    expenseChangePct: number;
    netChangeCents: number;
  } | null;
}

// ---------------------------------------------------------------------------
// Date helpers (native — no date-fns)
// ---------------------------------------------------------------------------

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Return "yyyy-MM" for a given UTC year (0-indexed month). */
function monthKey(year: number, month: number): string {
  const mm = String(month + 1).padStart(2, "0");
  return `${year}-${mm}`;
}

/** Parse "yyyy-MM" → UTC Date at the 1st of the month. */
function parseMonthKey(key: string): Date {
  const [y, m] = key.split("-").map(Number) as [number, number];
  return new Date(Date.UTC(y, m - 1, 1));
}

/** Friendly month name from "yyyy-MM". */
function monthName(key: string): string {
  const m = Number(key.slice(5, 7)) - 1;
  return MONTH_NAMES[m]!;
}

// ---------------------------------------------------------------------------
// Insight derivation
// ---------------------------------------------------------------------------

function buildYearlyInsights(
  totalIncomeCents: number,
  totalExpensesCents: number,
  monthly: YearlyMonth[],
  yoy: YearlyReport["previousYearComparison"],
  isPartialYear: boolean,
): Insight[] {
  const insights: Insight[] = [];

  // Best and worst months (only months with data)
  const monthsWithData = monthly.filter((m) => m.incomeCents > 0 || m.expensesCents > 0);
  if (monthsWithData.length > 1) {
    const best = monthsWithData.reduce((b, m) => m.netCents > b.netCents ? m : b);
    const worst = monthsWithData.reduce((w, m) => m.netCents < w.netCents ? m : w);
    const bestDollar = (best.netCents / 100).toFixed(2);
    const worstDollar = (worst.netCents / 100).toFixed(2);
    insights.push({
      type: "positive",
      message: `Best month: ${monthName(best.month)} (net $${bestDollar}).`,
    });
    insights.push({
      type: "info",
      message: `Tightest month: ${monthName(worst.month)} (net $${worstDollar}).`,
    });
  }

  // Year-over-year
  const yoyLabel = isPartialYear ? "vs same period last year" : "from last year";
  if (yoy) {
    if (yoy.incomeChangePct > 0) {
      insights.push({
        type: "positive",
        message: `Income up ${yoy.incomeChangePct.toFixed(1)}% ${yoyLabel}.`,
      });
    } else if (yoy.incomeChangePct < -5) {
      insights.push({
        type: "warning",
        message: `Income down ${Math.abs(yoy.incomeChangePct).toFixed(1)}% ${yoyLabel}.`,
      });
    }
    if (yoy.expenseChangePct > 10) {
      insights.push({
        type: "warning",
        message: `Expenses up ${yoy.expenseChangePct.toFixed(1)}% ${yoyLabel}.`,
      });
    } else if (yoy.expenseChangePct < 0) {
      insights.push({
        type: "positive",
        message: `Expenses down ${Math.abs(yoy.expenseChangePct).toFixed(1)}% ${yoyLabel}.`,
      });
    }
  }

  // Overall savings rate
  const annualSavingsRate =
    totalIncomeCents > 0
      ? ((totalIncomeCents - totalExpensesCents) / totalIncomeCents) * 100
      : 0;
  if (annualSavingsRate >= 20) {
    insights.push({
      type: "positive",
      message: `Annual savings rate of ${annualSavingsRate.toFixed(0)}% — excellent.`,
    });
  } else if (annualSavingsRate < 5) {
    insights.push({
      type: "warning",
      message: `Annual savings rate of only ${annualSavingsRate.toFixed(0)}%.`,
    });
  }

  return insights;
}

// ---------------------------------------------------------------------------
// Core aggregation helpers
// ---------------------------------------------------------------------------

interface YearWindow {
  /** Ordered "yyyy-MM" keys for the 12 months of this window. */
  months: string[];
  /** UTC milliseconds: start of first day (inclusive). */
  startMs: number;
  /** UTC milliseconds: end of last day (inclusive, 23:59:59.999 UTC). */
  endMs: number;
}

function calendarYearWindow(year: number): YearWindow {
  const months: string[] = [];
  for (let m = 0; m < 12; m++) {
    months.push(monthKey(year, m));
  }
  return {
    months,
    startMs: Date.UTC(year, 0, 1),
    endMs: Date.UTC(year, 11, 31, 23, 59, 59, 999),
  };
}

function financialYearWindow(endingYear: number): YearWindow {
  // FY ending year: starts 1 Jul (endingYear - 1), ends 30 Jun (endingYear)
  const startYear = endingYear - 1;
  const months: string[] = [];
  // Jul..Dec of startYear, then Jan..Jun of endingYear
  for (let i = 0; i < 12; i++) {
    const yr = i < 6 ? startYear : endingYear;
    const mo = (i + 6) % 12; // 0-indexed
    months.push(monthKey(yr, mo));
  }
  return {
    months,
    startMs: Date.UTC(startYear, 6, 1),                          // 1 Jul startYear
    endMs: Date.UTC(endingYear, 5, 30, 23, 59, 59, 999),         // 30 Jun endingYear
  };
}

/** Build monthly buckets and totals from a transaction list. */
function aggregate(
  txns: ReportTxn[],
  window: YearWindow,
  nowMs: number,
): {
  monthlyBreakdown: YearlyMonth[];
  totalIncomeCents: number;
  totalExpensesCents: number;
  netCents: number;
  monthsElapsed: number;
} {
  // Initialise all 12 buckets
  const buckets = new Map<string, { incomeCents: number; expensesCents: number }>();
  for (const mk of window.months) {
    buckets.set(mk, { incomeCents: 0, expensesCents: 0 });
  }

  let totalIncomeCents = 0;
  let totalExpensesCents = 0;

  for (const tx of txns) {
    if (tx.isTransfer) continue;
    const mk = (tx.settledAt ?? tx.createdAt).slice(0, 7); // "yyyy-MM"
    const bucket = buckets.get(mk);
    if (!bucket) continue; // outside this window
    if (tx.amountCents > 0) {
      bucket.incomeCents += tx.amountCents;
      totalIncomeCents += tx.amountCents;
    } else if (tx.amountCents < 0) {
      bucket.expensesCents += Math.abs(tx.amountCents);
      totalExpensesCents += Math.abs(tx.amountCents);
    }
  }

  // Months elapsed = buckets whose 1st day <= now
  let monthsElapsed = 0;
  const monthlyBreakdown: YearlyMonth[] = [];
  for (const mk of window.months) {
    const bucket = buckets.get(mk)!;
    const monthStartMs = parseMonthKey(mk).getTime();
    const isElapsed = monthStartMs <= nowMs;
    if (isElapsed) monthsElapsed++;

    const netCents = bucket.incomeCents - bucket.expensesCents;
    const savingsRate =
      bucket.incomeCents > 0 ? netCents / bucket.incomeCents : 0;

    monthlyBreakdown.push({
      month: mk,
      incomeCents: bucket.incomeCents,
      expensesCents: bucket.expensesCents,
      netCents,
      savingsRate,
    });
  }

  const netCents = totalIncomeCents - totalExpensesCents;

  return {
    monthlyBreakdown,
    totalIncomeCents,
    totalExpensesCents,
    netCents,
    monthsElapsed: Math.max(monthsElapsed, 1),
  };
}

/** Compute previous-year comparison from a previousYearTxns array. */
function buildPreviousYearComparison(
  totalIncomeCents: number,
  totalExpensesCents: number,
  netCents: number,
  prevTxns: ReportTxn[],
): YearlyReport["previousYearComparison"] {
  const prevIncomeCents = prevTxns
    .filter((tx) => !tx.isTransfer && tx.amountCents > 0)
    .reduce((sum, tx) => sum + tx.amountCents, 0);

  const prevExpensesCents = prevTxns
    .filter((tx) => !tx.isTransfer && tx.amountCents < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amountCents), 0);

  const prevNetCents = prevIncomeCents - prevExpensesCents;

  const incomeChangePct =
    prevIncomeCents > 0
      ? ((totalIncomeCents - prevIncomeCents) / prevIncomeCents) * 100
      : 0;

  const expenseChangePct =
    prevExpensesCents > 0
      ? ((totalExpensesCents - prevExpensesCents) / prevExpensesCents) * 100
      : 0;

  const netChangeCents = netCents - prevNetCents;

  return { incomeChangePct, expenseChangePct, netChangeCents };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function buildYearlyReport(
  txns: ReportTxn[],
  year: number,
  opts: {
    isFinancialYear: boolean;
    now: string;      // ISO string
    categoryNames: Map<string, { name: string; parentName: string | null }>;
    previousYearTxns?: ReportTxn[];
  },
): YearlyReport {
  const window = opts.isFinancialYear
    ? financialYearWindow(year)
    : calendarYearWindow(year);

  const nowMs = new Date(opts.now).getTime();
  const isPartialYear = window.endMs > nowMs;

  const {
    monthlyBreakdown,
    totalIncomeCents,
    totalExpensesCents,
    netCents,
    monthsElapsed,
  } = aggregate(txns, window, nowMs);

  const averageMonthlyIncomeCents = Math.round(totalIncomeCents / monthsElapsed);
  const averageMonthlyExpensesCents = Math.round(totalExpensesCents / monthsElapsed);

  const categoryBreakdown = buildCategoryBreakdown(txns, opts.categoryNames);

  const previousYearComparison =
    opts.previousYearTxns !== undefined
      ? buildPreviousYearComparison(
          totalIncomeCents,
          totalExpensesCents,
          netCents,
          opts.previousYearTxns,
        )
      : null;

  const insights = buildYearlyInsights(
    totalIncomeCents,
    totalExpensesCents,
    monthlyBreakdown,
    previousYearComparison,
    isPartialYear,
  );

  return {
    year,
    isPartialYear,
    totalIncomeCents,
    totalExpensesCents,
    netCents,
    averageMonthlyIncomeCents,
    averageMonthlyExpensesCents,
    monthlyBreakdown,
    categoryBreakdown,
    insights,
    previousYearComparison,
  };
}
