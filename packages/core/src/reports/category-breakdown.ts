/**
 * Category breakdown for expense reports.
 *
 * Pure function — no DB access, no side effects.
 * Integer cents throughout. Never parseFloat a money value.
 * Only percentageOfTotal is a ratio float.
 */

import type { ReportTxn } from "./salary-periods";

export interface CategoryBreakdownItem {
  categoryName: string;
  parentCategoryName: string | null;
  totalCents: number;          // absolute expense cents
  transactionCount: number;
  percentageOfTotal: number;   // 0..100 (ratio float)
}

/**
 * Build an expense breakdown grouped by category.
 *
 * - Expenses only (amountCents < 0); transfers excluded.
 * - Sorted by totalCents descending.
 * - categoryNames maps categoryId → { name, parentName }.
 *   Falls back to "Uncategorised" for null / unknown categoryId.
 */
export function buildCategoryBreakdown(
  txns: ReportTxn[],
  categoryNames: Map<string, { name: string; parentName: string | null }>,
): CategoryBreakdownItem[] {
  const catMap = new Map<string, { total: number; count: number; parent: string | null }>();

  for (const tx of txns) {
    if (tx.amountCents >= 0) continue;   // skip income
    if (tx.isTransfer) continue;          // skip transfers

    const info = tx.categoryId != null ? categoryNames.get(tx.categoryId) : undefined;
    const catName = info?.name ?? "Uncategorised";
    const parentName = info?.parentName ?? null;

    const existing = catMap.get(catName);
    if (existing) {
      existing.total += Math.abs(tx.amountCents);
      existing.count += 1;
    } else {
      catMap.set(catName, {
        total: Math.abs(tx.amountCents),
        count: 1,
        parent: parentName,
      });
    }
  }

  const totalCents = Array.from(catMap.values()).reduce((s, v) => s + v.total, 0);

  return Array.from(catMap.entries())
    .map(([name, data]) => ({
      categoryName: name,
      parentCategoryName: data.parent,
      totalCents: data.total,
      transactionCount: data.count,
      percentageOfTotal: totalCents > 0 ? (data.total / totalCents) * 100 : 0,
    }))
    .sort((a, b) => b.totalCents - a.totalCents);
}
