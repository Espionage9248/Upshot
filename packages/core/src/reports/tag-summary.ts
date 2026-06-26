/**
 * Tag-level spending summary.
 *
 * Pure function — no DB access, no side effects.
 * Integer cents throughout. Never parseFloat a money value.
 *
 * Port of V1 `getTagSummary` (reportService.ts:580-617), adapted to use
 * pre-parsed string[] tags (no JSON.parse needed) and integer cents.
 */

import type { ReportTxn } from "./salary-periods";

export interface TagSummaryItem {
  tag: string;
  totalCents: number;
  transactionCount: number;
}

/**
 * Summarise expense spending by tag.
 *
 * - Expenses only (amountCents < 0); transfers excluded.
 * - If startISO / endISO are provided (inclusive "yyyy-MM-dd" strings), only
 *   transactions whose authoritative date (settledAt ?? createdAt) falls within
 *   that window are included.
 * - Sorted by totalCents descending.
 */
export function buildTagSummary(
  txns: ReportTxn[],
  startISO?: string,
  endISO?: string,
): TagSummaryItem[] {
  // Build inclusive ms bounds when a window is requested.
  const startMs = startISO != null ? Date.parse(startISO + "T00:00:00.000Z") : null;
  const endMs   = endISO   != null ? Date.parse(endISO   + "T23:59:59.999Z") : null;

  const tagMap = new Map<string, { total: number; count: number }>();

  for (const tx of txns) {
    if (tx.amountCents >= 0) continue;   // skip income
    if (tx.isTransfer) continue;          // skip transfers
    if (tx.tags.length === 0) continue;   // skip untagged

    // Apply optional date window.
    if (startMs != null || endMs != null) {
      const txMs = Date.parse(tx.settledAt ?? tx.createdAt);
      if (startMs != null && txMs < startMs) continue;
      if (endMs   != null && txMs > endMs)   continue;
    }

    for (const tag of tx.tags) {
      const e = tagMap.get(tag) ?? { total: 0, count: 0 };
      e.total += Math.abs(tx.amountCents);
      e.count += 1;
      tagMap.set(tag, e);
    }
  }

  return Array.from(tagMap.entries())
    .map(([tag, d]) => ({
      tag,
      totalCents: d.total,
      transactionCount: d.count,
    }))
    .sort((a, b) => b.totalCents - a.totalCents);
}
