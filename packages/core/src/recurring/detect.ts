import type { DetectableTransaction, DetectedRecurring, Frequency } from "./types";

const FREQUENCY_RANGES: Array<{ min: number; max: number; frequency: Frequency }> = [
  { min: 5, max: 9, frequency: "WEEKLY" },
  { min: 12, max: 17, frequency: "FORTNIGHTLY" },
  { min: 25, max: 35, frequency: "MONTHLY" },
  { min: 80, max: 100, frequency: "QUARTERLY" },
  { min: 340, max: 400, frequency: "YEARLY" },
];

/** Detect frequency from a median interval in days. */
export function detectFrequency(medianDays: number): Frequency | null {
  for (const range of FREQUENCY_RANGES) {
    if (medianDays >= range.min && medianDays <= range.max) {
      return range.frequency;
    }
  }
  return null;
}

/** Calculate the next expected ISO date string from lastDate + frequency. */
export function nextExpectedDate(lastDate: string, frequency: Frequency): string {
  const d = new Date(lastDate + "T00:00:00Z");
  switch (frequency) {
    case "WEEKLY":
      d.setUTCDate(d.getUTCDate() + 7);
      break;
    case "FORTNIGHTLY":
      d.setUTCDate(d.getUTCDate() + 14);
      break;
    case "MONTHLY":
      d.setUTCMonth(d.getUTCMonth() + 1);
      break;
    case "QUARTERLY":
      d.setUTCMonth(d.getUTCMonth() + 3);
      break;
    case "YEARLY":
      d.setUTCFullYear(d.getUTCFullYear() + 1);
      break;
  }
  return d.toISOString().slice(0, 10);
}

/** Return the median of a non-empty sorted numeric array. */
function medianOf(sorted: number[]): number {
  const mid = sorted[Math.floor(sorted.length / 2)];
  // Array is guaranteed non-empty by callers who check length >= 3
  return mid ?? 0;
}

/**
 * Detect recurring expenses from a list of transactions.
 * Pure function — no DB access.
 */
export function detectRecurring(
  transactions: DetectableTransaction[],
  opts: { now: string; existingNonSuggestedPatterns: Set<string> },
): DetectedRecurring[] {
  // Filter: expenses only, exclude transfers and salary
  const expenses = transactions.filter(
    (tx) => !tx.isTransfer && !tx.isSalary && tx.amountCents < 0,
  );

  // Group by normalised description key
  const groups = new Map<string, { tx: DetectableTransaction; origDescription: string }[]>();
  for (const tx of expenses) {
    const key = tx.description.trim().toLowerCase();
    const existing = groups.get(key);
    if (existing) {
      existing.push({ tx, origDescription: tx.description.trim() });
    } else {
      groups.set(key, [{ tx, origDescription: tx.description.trim() }]);
    }
  }

  const results: DetectedRecurring[] = [];

  for (const [pattern, entries] of groups) {
    // Skip patterns already tracked as non-suggested (dismissed / accepted)
    if (opts.existingNonSuggestedPatterns.has(pattern)) continue;

    // Need at least 3 occurrences
    if (entries.length < 3) continue;

    // Amount consistency: within ±15% of median; reject if >20% of amounts deviate
    const amounts = entries.map((e) => Math.abs(e.tx.amountCents)).sort((a, b) => a - b);
    const medianAmount = medianOf(amounts);
    const outOfRange = amounts.filter(
      (a) => Math.abs(a - medianAmount) / medianAmount > 0.15,
    );
    if (outOfRange.length / amounts.length > 0.2) continue;

    // Sort entries by date ascending
    const sorted = [...entries].sort((a, b) => a.tx.date.localeCompare(b.tx.date));

    // Calculate intervals in days between consecutive entries
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const prevEntry = sorted[i - 1];
      const currEntry = sorted[i];
      if (!prevEntry || !currEntry) continue;
      const prev = new Date(prevEntry.tx.date + "T00:00:00Z");
      const curr = new Date(currEntry.tx.date + "T00:00:00Z");
      const days = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      intervals.push(days);
    }

    if (intervals.length === 0) continue;

    // Median interval
    const sortedIntervals = [...intervals].sort((a, b) => a - b);
    const medianInterval = medianOf(sortedIntervals);

    // Detect frequency from median interval
    const frequency = detectFrequency(medianInterval);
    if (!frequency) continue;

    // Timing regularity: std-dev / median < 0.3
    if (medianInterval > 0) {
      const mean = intervals.reduce((sum, v) => sum + v, 0) / intervals.length;
      const variance = intervals.reduce((sum, v) => sum + (v - mean) ** 2, 0) / intervals.length;
      const stdDev = Math.sqrt(variance);
      if (stdDev / medianInterval > 0.3) continue;
    }

    const firstEntry = sorted[0];
    const lastEntry = sorted[sorted.length - 1];
    if (!firstEntry || !lastEntry) continue;

    // displayName: original-cased description from the most recent entry
    const displayName = lastEntry.origDescription;

    results.push({
      descriptionPattern: pattern,
      displayName,
      amountCents: medianAmount, // positive magnitude
      frequency,
      category: lastEntry.tx.categoryName,
      merchant: displayName,
      accountId: lastEntry.tx.accountId,
      firstDate: firstEntry.tx.date,
      lastDate: lastEntry.tx.date,
      nextExpectedDate: nextExpectedDate(lastEntry.tx.date, frequency),
    });
  }

  return results;
}
