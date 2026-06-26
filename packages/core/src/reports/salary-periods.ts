/**
 * Salary period derivation for reports.
 *
 * Pure function — no DB access, no side effects. `now` is injected as an ISO
 * string so results are fully deterministic in tests.
 *
 * Integer cents throughout. Never parseFloat a money value.
 */

export interface ReportTxn {
  id: string;
  amountCents: number;       // signed: income > 0, expense < 0
  isSalary: boolean;
  isTransfer: boolean;
  categoryId: string | null;
  parentCategoryId: string | null;
  settledAt: string | null;  // ISO
  createdAt: string;         // ISO
  tags: string[];
}

export interface SalaryPeriod {
  index: number;             // 0 = most recent
  startDate: string;         // ISO
  endDate: string;           // ISO
  salaryAmountCents: number;
  salaryTransactionId: string;
  label: string;             // e.g. "15 Jan – 14 Feb 2026"
}

// ---------------------------------------------------------------------------
// Date helpers (native — no date-fns dep required)
// ---------------------------------------------------------------------------

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Format a UTC date as "d MMM" (e.g. "15 Jan"). */
function formatShort(d: Date): string {
  return `${d.getUTCDate()} ${MONTH_SHORT[d.getUTCMonth()]!}`;
}

/** Format a UTC date as "d MMM yyyy" (e.g. "14 Feb 2026"). */
function formatLong(d: Date): string {
  return `${d.getUTCDate()} ${MONTH_SHORT[d.getUTCMonth()]!} ${d.getUTCFullYear()}`;
}

/** Format a UTC date as "MMMM yyyy" (e.g. "March 2026"). */
function formatMonthYear(d: Date): string {
  return `${MONTH_NAMES[d.getUTCMonth()]!} ${d.getUTCFullYear()}`;
}

/** Return a new Date that is `n` days before `d` (UTC). */
function subDays(d: Date, n: number): Date {
  return new Date(d.getTime() - n * 86_400_000);
}

/** First moment of the UTC month containing `d`. */
function startOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

/** Last moment of the UTC month containing `d` (23:59:59.999Z). */
function endOfMonth(d: Date): Date {
  // Day 0 of the next month = last day of this month.
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999));
}

// ---------------------------------------------------------------------------
// Calendar-month fallback
// ---------------------------------------------------------------------------

function getCalendarMonthPeriods(now: Date): SalaryPeriod[] {
  const year = now.getUTCFullYear();
  const periods: SalaryPeriod[] = [];

  for (let m = 0; m < 12; m++) {
    const monthDate = new Date(Date.UTC(year, m, 1));
    if (monthDate > now) break;

    const start = startOfMonth(monthDate);
    const isCurrentMonth =
      monthDate.getUTCMonth() === now.getUTCMonth() &&
      monthDate.getUTCFullYear() === now.getUTCFullYear();
    const end = isCurrentMonth ? now : endOfMonth(monthDate);

    periods.push({
      index: m,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      salaryAmountCents: 0,
      salaryTransactionId: "",
      label: formatMonthYear(monthDate),
    });
  }

  return periods.reverse().map((p, i) => ({ ...p, index: i }));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Derive pay-cycle periods from a list of transactions.
 *
 * - Filters to salary transactions (isSalary === true), sorted chronologically.
 * - Each period runs from a salary date to the day before the next salary date.
 * - The last (open) period ends at `now`.
 * - Returns most-recent-first, with `index` re-assigned (0 = most recent).
 * - Falls back to calendar months for the current year when no salary txns exist.
 * - Uses `settledAt ?? createdAt` as the authoritative period date.
 */
export function deriveSalaryPeriods(txns: ReportTxn[], now: string): SalaryPeriod[] {
  const nowDate = new Date(now);

  const salaryTxns = txns
    .filter((tx) => tx.isSalary)
    .sort((a, b) => {
      const aDate = a.settledAt ?? a.createdAt;
      const bDate = b.settledAt ?? b.createdAt;
      return aDate < bDate ? -1 : aDate > bDate ? 1 : 0;
    });

  if (salaryTxns.length === 0) {
    return getCalendarMonthPeriods(nowDate);
  }

  const periods: SalaryPeriod[] = [];

  for (let i = 0; i < salaryTxns.length; i++) {
    const tx = salaryTxns[i]!;
    const txDateStr = tx.settledAt ?? tx.createdAt;
    const txDate = new Date(txDateStr);

    const nextTx = salaryTxns[i + 1];
    let endDate: Date;
    if (nextTx) {
      const nextDateStr = nextTx.settledAt ?? nextTx.createdAt;
      endDate = subDays(new Date(nextDateStr), 1);
    } else {
      endDate = nowDate;
    }

    const label = `${formatShort(txDate)} – ${formatLong(endDate)}`;

    periods.push({
      index: i,
      startDate: txDateStr,
      endDate: endDate.toISOString(),
      salaryAmountCents: tx.amountCents,
      salaryTransactionId: tx.id,
      label,
    });
  }

  return periods.reverse().map((p, i) => ({ ...p, index: i }));
}
