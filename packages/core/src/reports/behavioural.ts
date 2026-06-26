/**
 * Behavioural analytics — spending insights, no-spend streaks, heatmap bins.
 *
 * Pure functions — no DB access, no side effects. `now` is injected as an ISO
 * string so results are fully deterministic in tests.
 *
 * Integer cents throughout. Never parseFloat a money value.
 * Only `intensity` and `changePct` (in deltas.ts) are ratio floats.
 *
 * Port sources:
 *   - getSpendingInsights  ← V1 insightsService.ts:337-426
 *   - getBehaviouralInsights ← V1 insightsService.ts:430-545
 *   - computeNoSpendStreak + buildSpendingHeatmap are NEW (not in V1)
 *
 * Do NOT add getCashFlowForecast here — that is Task 6.2.
 */

import type { ReportTxn } from "./salary-periods";

// ---------------------------------------------------------------------------
// Exported interfaces
// ---------------------------------------------------------------------------

export interface SpendingInsight {
  category: string;
  message: string;
  severity: "info" | "warning";
}

export interface BehaviouralInsight {
  pattern: string;
  message: string;
}

export interface NoSpendStreak {
  currentDays: number;
  bestDays: number;
  bestEndedOn: string | null;
}

export interface HeatmapDay {
  date: string;       // YYYY-MM-DD
  spendCents: number;
  intensity: number;  // 0..1 float
  isZero: boolean;
}

// ---------------------------------------------------------------------------
// Internal helpers (no date-fns — inline UTC date math)
// ---------------------------------------------------------------------------

/** Return the YYYY-MM-DD date key for an ISO datetime string (UTC). */
function isoDay(iso: string): string {
  return iso.slice(0, 10);
}

/** Return date string `n` days before `baseIso` (UTC), as YYYY-MM-DD. */
function daysBeforeISO(baseIso: string, n: number): string {
  const ms = Date.parse(baseIso) - n * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

/** Iterate UTC day keys from startISO to endISO inclusive. */
function* eachDayKey(startISO: string, endISO: string): Generator<string> {
  let cursor = Date.parse(startISO.slice(0, 10) + "T00:00:00.000Z");
  const end = Date.parse(endISO.slice(0, 10) + "T00:00:00.000Z");
  while (cursor <= end) {
    yield new Date(cursor).toISOString().slice(0, 10);
    cursor += 86_400_000;
  }
}

/** Format a cents amount as "$N,NNN" for display (no parseFloat). */
function formatAud(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString("en-AU")}`;
}

// ---------------------------------------------------------------------------
// getSpendingInsights
// ---------------------------------------------------------------------------

/**
 * Compare current-month category spending vs the prior 3-month monthly average.
 * Returns up to 8 insights, sorted by magnitude of change.
 *
 * Ported from V1 insightsService.ts:337-426, adapted for integer cents.
 */
export function getSpendingInsights(txns: ReportTxn[], now: string): SpendingInsight[] {
  const nowDate = new Date(now);
  const nowMs = nowDate.getTime();

  // Current month bounds (UTC)
  const currentMonthStart = new Date(Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth(), 1));
  // Prior 3-month window: start of (now - 3 months) → end of last month
  const priorWindowStart = new Date(Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth() - 3, 1));
  const priorWindowEnd = new Date(Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth(), 0, 23, 59, 59, 999));

  const currentMonthStartMs = currentMonthStart.getTime();
  const priorWindowStartMs = priorWindowStart.getTime();
  const priorWindowEndMs = priorWindowEnd.getTime();

  // Collect expense (non-transfer, non-salary, negative) txns only
  const isExpense = (tx: ReportTxn) =>
    !tx.isTransfer && !tx.isSalary && tx.amountCents < 0 && tx.categoryId != null;

  const currentMap = new Map<string, number>();
  const priorMap = new Map<string, number>();

  for (const tx of txns) {
    if (!isExpense(tx)) continue;
    const ms = Date.parse(tx.createdAt);
    const cat = tx.categoryId!;
    const absCents = Math.abs(tx.amountCents);

    if (ms >= currentMonthStartMs && ms <= nowMs) {
      currentMap.set(cat, (currentMap.get(cat) ?? 0) + absCents);
    } else if (ms >= priorWindowStartMs && ms <= priorWindowEndMs) {
      priorMap.set(cat, (priorMap.get(cat) ?? 0) + absCents);
    }
  }

  // Convert prior totals to monthly average (÷3)
  const priorAvgMap = new Map<string, number>();
  for (const [cat, total] of priorMap) {
    priorAvgMap.set(cat, Math.round(total / 3));
  }

  const allCategories = new Set([...currentMap.keys(), ...priorAvgMap.keys()]);
  const insights: Array<SpendingInsight & { _magnitude: number }> = [];

  const NOISE_THRESHOLD = 1000; // $10 in cents (V1 used $10 floats)

  for (const category of allCategories) {
    const current = currentMap.get(category) ?? 0;
    const avg = priorAvgMap.get(category) ?? 0;

    if (current < NOISE_THRESHOLD && avg < NOISE_THRESHOLD) continue;

    let message: string;
    let severity: SpendingInsight["severity"];
    let magnitude: number;

    if (avg === 0 && current > 0) {
      message = `New spending: ${category} this month (${formatAud(current)})`;
      severity = "info";
      magnitude = current;
    } else if (avg > 0 && current === 0) {
      message = `${category} spending stopped (was ${formatAud(avg)}/mo avg)`;
      severity = "info";
      magnitude = avg;
    } else if (avg > 0 && current / avg > 1.2) {
      const changePercent = Math.round((current / avg - 1) * 100);
      message = `${category} up ${changePercent}% vs 3-month avg`;
      severity = "warning";
      magnitude = Math.abs(current - avg);
    } else if (avg > 0 && current / avg < 0.8) {
      const changePercent = Math.round((1 - current / avg) * 100);
      message = `${category} down ${changePercent}% vs 3-month avg`;
      severity = "info";
      magnitude = Math.abs(current - avg);
    } else {
      continue; // within ±20% — not interesting
    }

    insights.push({ category, message, severity, _magnitude: magnitude });
  }

  // Sort by magnitude (largest delta first), take top 8
  insights.sort((a, b) => b._magnitude - a._magnitude);
  return insights.slice(0, 8).map(({ category, message, severity }) => ({
    category,
    message,
    severity,
  }));
}

// ---------------------------------------------------------------------------
// getBehaviouralInsights
// ---------------------------------------------------------------------------

const DAY_NAMES = [
  "Sundays", "Mondays", "Tuesdays", "Wednesdays",
  "Thursdays", "Fridays", "Saturdays",
];

/**
 * Detect day-of-week, time-of-day, and frequency patterns in the last 90 days.
 * Returns up to 4 insights.
 *
 * Ported from V1 insightsService.ts:430-545, adapted for integer cents and
 * no date-fns dependency (native UTC date math).
 */
export function getBehaviouralInsights(txns: ReportTxn[], now: string): BehaviouralInsight[] {
  const nowMs = Date.parse(now);
  const ninetyDaysAgoMs = nowMs - 90 * 86_400_000;

  // Filter to expense txns in the 90-day window
  const window90 = txns.filter(
    (tx) =>
      !tx.isTransfer &&
      !tx.isSalary &&
      tx.amountCents < 0 &&
      Date.parse(tx.createdAt) >= ninetyDaysAgoMs &&
      Date.parse(tx.createdAt) <= nowMs,
  );

  if (window90.length === 0) return [];

  const insights: BehaviouralInsight[] = [];
  const totalSpentCents = window90.reduce((s, tx) => s + Math.abs(tx.amountCents), 0);

  // ── Day-of-week pattern ──
  const dayTotals: number[] = [0, 0, 0, 0, 0, 0, 0];
  for (const tx of window90) {
    const d = new Date(tx.createdAt).getUTCDay();
    dayTotals[d] = (dayTotals[d] ?? 0) + Math.abs(tx.amountCents);
  }

  const dailyAvgCents = totalSpentCents / 90;
  const daysInWindow = 90 / 7;
  let highestDayIdx = -1;
  let highestDayAvgCents = 0;
  for (let d = 0; d < 7; d++) {
    const dayAvg = (dayTotals[d] ?? 0) / daysInWindow;
    if (dayAvg > highestDayAvgCents) {
      highestDayAvgCents = dayAvg;
      highestDayIdx = d;
    }
  }

  if (highestDayIdx >= 0 && dailyAvgCents > 0 && highestDayAvgCents > dailyAvgCents * 1.3) {
    insights.push({
      pattern: "day_of_week",
      message: `You tend to spend more on ${DAY_NAMES[highestDayIdx] ?? ""}`,
    });
  }

  // ── Time-of-day pattern ──
  const buckets: Record<string, number> = {
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0,
  };
  for (const tx of window90) {
    const h = new Date(tx.createdAt).getUTCHours();
    if (h >= 6 && h < 12) buckets["morning"] = (buckets["morning"] ?? 0) + Math.abs(tx.amountCents);
    else if (h >= 12 && h < 17) buckets["afternoon"] = (buckets["afternoon"] ?? 0) + Math.abs(tx.amountCents);
    else if (h >= 17 && h < 22) buckets["evening"] = (buckets["evening"] ?? 0) + Math.abs(tx.amountCents);
    else buckets["night"] = (buckets["night"] ?? 0) + Math.abs(tx.amountCents);
  }

  const topBucket = Object.entries(buckets).sort((a, b) => b[1] - a[1])[0];
  if (topBucket && totalSpentCents > 0 && topBucket[1] / totalSpentCents > 0.4) {
    insights.push({
      pattern: "time_of_day",
      message: `Most of your spending happens in the ${topBucket[0]}`,
    });
  }

  // ── Frequency trend (12-week window) ──
  const twelveWeeksAgoMs = nowMs - 84 * 86_400_000; // 12 × 7 days
  const recent12w = txns.filter(
    (tx) =>
      !tx.isTransfer &&
      !tx.isSalary &&
      tx.amountCents < 0 &&
      Date.parse(tx.createdAt) >= twelveWeeksAgoMs &&
      Date.parse(tx.createdAt) <= nowMs,
  );

  const weekCounts: number[] = Array.from({ length: 12 }, () => 0);
  for (const tx of recent12w) {
    const weekIdx = Math.floor((nowMs - Date.parse(tx.createdAt)) / (7 * 86_400_000));
    if (weekIdx >= 0 && weekIdx < 12) {
      weekCounts[weekIdx] = (weekCounts[weekIdx] ?? 0) + 1;
    }
  }

  const allWeeksAvg = weekCounts.reduce((a, b) => a + b, 0) / 12;
  const recentWeeksAvg = ((weekCounts[0] ?? 0) + (weekCounts[1] ?? 0) + (weekCounts[2] ?? 0)) / 3;

  if (allWeeksAvg > 0) {
    if (recentWeeksAvg > allWeeksAvg * 1.25) {
      insights.push({
        pattern: "frequency",
        message: "You're making more frequent purchases lately",
      });
    } else if (recentWeeksAvg < allWeeksAvg * 0.8) {
      insights.push({
        pattern: "frequency",
        message: "You're spending less frequently than usual — good discipline!",
      });
    }
  }

  return insights.slice(0, 4);
}

// ---------------------------------------------------------------------------
// computeNoSpendStreak (NEW — not in V1)
// ---------------------------------------------------------------------------

/**
 * Compute the current and best no-spend streak in the last 90 days.
 *
 * A "spend day" = a day with ≥1 expense (negative, non-transfer) txn.
 * A zero-spend day has `spendCents === 0`.
 *
 * `currentDays` = consecutive zero-spend days ending at `now` (today's date).
 * `bestDays`    = longest zero-spend run in the window.
 * `bestEndedOn` = ISO date (YYYY-MM-DD) the best run ended, or null if the
 *                 best run is the current (ongoing) streak.
 */
export function computeNoSpendStreak(txns: ReportTxn[], now: string): NoSpendStreak {
  const WINDOW_DAYS = 90;
  const todayKey = isoDay(now);
  const windowStartKey = daysBeforeISO(now, WINDOW_DAYS - 1);

  // Build a set of days that have expense spend
  const spendDays = new Set<string>();
  for (const tx of txns) {
    if (tx.isTransfer || tx.isSalary || tx.amountCents >= 0) continue;
    const dayKey = isoDay(tx.createdAt);
    if (dayKey >= windowStartKey && dayKey <= todayKey) {
      spendDays.add(dayKey);
    }
  }

  // Walk the window day-by-day and track runs
  let currentDays = 0;
  let bestDays = 0;
  let bestEndedOn: string | null = null;
  let runLen = 0;
  let runLastDay: string | null = null;

  for (const day of eachDayKey(windowStartKey, todayKey)) {
    if (!spendDays.has(day)) {
      runLen++;
      runLastDay = day;
    } else {
      if (runLen > bestDays) {
        bestDays = runLen;
        bestEndedOn = runLastDay;
      }
      runLen = 0;
      runLastDay = null;
    }
  }

  // Handle trailing run (includes today)
  currentDays = runLen;
  if (runLen > bestDays) {
    bestDays = runLen;
    // The current (ongoing) streak hasn't "ended" yet
    bestEndedOn = null;
  }
  // If a past run tied the best, prefer the non-null bestEndedOn already set
  // (no change needed — bestEndedOn stays as-is from the loop)

  return { currentDays, bestDays, bestEndedOn };
}

// ---------------------------------------------------------------------------
// buildSpendingHeatmap (NEW — not in V1)
// ---------------------------------------------------------------------------

/**
 * Build one `HeatmapDay` entry per calendar day in [startISO, endISO].
 *
 * `spendCents`  = sum of Math.abs(amountCents) for that day's expense txns.
 * `isZero`      = spendCents === 0.
 * `intensity`   = maxSpend > 0 ? spendCents / maxSpend : 0  (0..1 float).
 */
export function buildSpendingHeatmap(
  txns: ReportTxn[],
  startISO: string,
  endISO: string,
): HeatmapDay[] {
  const startKey = startISO.slice(0, 10);
  const endKey = endISO.slice(0, 10);

  // Accumulate spend per day
  const spendByDay = new Map<string, number>();

  for (const day of eachDayKey(startKey, endKey)) {
    spendByDay.set(day, 0);
  }

  for (const tx of txns) {
    if (tx.isTransfer || tx.isSalary || tx.amountCents >= 0) continue;
    const dayKey = isoDay(tx.createdAt);
    if (dayKey < startKey || dayKey > endKey) continue;
    spendByDay.set(dayKey, (spendByDay.get(dayKey) ?? 0) + Math.abs(tx.amountCents));
  }

  // Find max for intensity normalization
  let maxSpend = 0;
  for (const v of spendByDay.values()) {
    if (v > maxSpend) maxSpend = v;
  }

  const days: HeatmapDay[] = [];
  for (const day of eachDayKey(startKey, endKey)) {
    const spendCents = spendByDay.get(day) ?? 0;
    days.push({
      date: day,
      spendCents,
      intensity: maxSpend > 0 ? spendCents / maxSpend : 0,
      isZero: spendCents === 0,
    });
  }

  return days;
}
