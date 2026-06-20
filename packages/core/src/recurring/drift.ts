import type { DriftResult, OverlapGroup } from "./types";

/**
 * Detect if a new charge represents a price change.
 * @param current - current stored amountCents and lastAmountCents
 * @param newChargeCents - the new charge amount (positive magnitude)
 * @param tolerance - fractional tolerance (default 0.0 — any difference is drift)
 */
export function priceDrift(
  current: { amountCents: number; lastAmountCents: number | null },
  newChargeCents: number,
  tolerance = 0.0,
): DriftResult {
  const prev = current.amountCents;
  const diff = Math.abs(newChargeCents - prev);
  const changed = prev === 0 ? newChargeCents !== prev : diff / prev > tolerance;

  return {
    changed,
    newAmountCents: newChargeCents,
    previousAmountCents: current.lastAmountCents,
  };
}

/**
 * Find groups of recurring items that overlap by category or merchant.
 * Groups of size < 2 are excluded.
 * Items with both null category and null merchant are not grouped.
 */
export function findOverlaps(
  items: { id: string; category: string | null; merchant: string | null }[],
): OverlapGroup[] {
  const byCategory = new Map<string, string[]>();
  const byMerchant = new Map<string, string[]>();

  for (const item of items) {
    if (item.category !== null) {
      const existing = byCategory.get(item.category) ?? [];
      existing.push(item.id);
      byCategory.set(item.category, existing);
    }
    if (item.merchant !== null) {
      const existing = byMerchant.get(item.merchant) ?? [];
      existing.push(item.id);
      byMerchant.set(item.merchant, existing);
    }
  }

  const groups: OverlapGroup[] = [];

  for (const [key, ids] of byCategory) {
    if (ids.length >= 2) {
      groups.push({ groupKey: `category:${key}`, itemIds: ids });
    }
  }
  for (const [key, ids] of byMerchant) {
    if (ids.length >= 2) {
      groups.push({ groupKey: `merchant:${key}`, itemIds: ids });
    }
  }

  return groups;
}
