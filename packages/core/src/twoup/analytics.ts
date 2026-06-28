import type { TwoUpTxn, Owner } from "./types";
import { computeSettlement, type Settlement } from "./settlement";

// ---------- Interfaces ----------

export interface PersonPanel {
  putInCents: number;
  shareOfCostsCents: number;
  netCents: number;
}

export interface CategoryTotal {
  category: string;
  cents: number;
  count: number;
}

export interface MonthPoint {
  month: string;
  totalInCents: number;
}

export interface TwoUpOverview {
  totalInCents: number;
  totalSpentCents: number;
  distributedCents: number;
  james: PersonPanel;
  britt: PersonPanel;
  settlement: Settlement;
  jamesPct: number;
  brittPct: number;
  rhythm: MonthPoint[];
  categories: CategoryTotal[];
  unassignedInCents: number;
}

export interface LedgerFilter {
  owner?: Owner;
  category?: string;
  direction?: "IN" | "OUT";
  search?: string;
  from?: string;
  to?: string;
}

// ---------- buildOverview ----------

export function buildOverview(txns: TwoUpTxn[]): TwoUpOverview {
  let totalInCents = 0;
  let totalSpentCents = 0;
  let unassignedInCents = 0;

  // For rhythm: month → total inflow
  const rhythmMap = new Map<string, number>();
  // For categories: category → { cents, count }
  const catMap = new Map<string, { cents: number; count: number }>();

  for (const t of txns) {
    if (t.owner === "REVERSAL") continue;

    if (t.amountCents > 0) {
      totalInCents += t.amountCents;
      if (t.owner === "UNASSIGNED") {
        unassignedInCents += t.amountCents;
      }
      // rhythm: month from date.slice(0,7)
      const month = t.date.slice(0, 7);
      rhythmMap.set(month, (rhythmMap.get(month) ?? 0) + t.amountCents);
    } else {
      // outflow
      const abs = -t.amountCents;
      totalSpentCents += abs;
      // category totals
      const cat = t.category ?? "Uncategorised";
      const existing = catMap.get(cat);
      if (existing) {
        existing.cents += abs;
        existing.count += 1;
      } else {
        catMap.set(cat, { cents: abs, count: 1 });
      }
    }
  }

  const distributedCents = totalInCents - totalSpentCents;

  const settlement = computeSettlement(txns);

  const { jamesContribCents, brittContribCents, sharedOutCents, jamesPersonalCents, brittPersonalCents } = settlement;

  const half = Math.round(sharedOutCents / 2);

  const james: PersonPanel = {
    putInCents: jamesContribCents,
    shareOfCostsCents: half + jamesPersonalCents,
    netCents: settlement.jamesNetCents,
  };

  const britt: PersonPanel = {
    putInCents: brittContribCents,
    shareOfCostsCents: half + brittPersonalCents,
    netCents: settlement.brittNetCents,
  };

  const totalContrib = jamesContribCents + brittContribCents;
  const jamesPct = totalContrib === 0 ? 0 : (jamesContribCents / totalContrib) * 100;
  const brittPct = totalContrib === 0 ? 0 : (brittContribCents / totalContrib) * 100;

  // rhythm: sorted ascending by month key
  const rhythm: MonthPoint[] = Array.from(rhythmMap.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([month, totalInCents]) => ({ month, totalInCents }));

  // categories: sorted descending by cents
  const categories: CategoryTotal[] = Array.from(catMap.entries())
    .map(([category, { cents, count }]) => ({ category, cents, count }))
    .sort((a, b) => b.cents - a.cents);

  return {
    totalInCents,
    totalSpentCents,
    distributedCents,
    james,
    britt,
    settlement,
    jamesPct,
    brittPct,
    rhythm,
    categories,
    unassignedInCents,
  };
}

// ---------- filterLedger ----------

export function filterLedger(txns: TwoUpTxn[], f: LedgerFilter): TwoUpTxn[] {
  const searchLower = f.search ? f.search.toLowerCase() : undefined;

  const filtered = txns.filter((t) => {
    // Always exclude REVERSAL
    if (t.owner === "REVERSAL") return false;
    // owner filter
    if (f.owner !== undefined && t.owner !== f.owner) return false;
    // category filter
    if (f.category !== undefined && t.category !== f.category) return false;
    // direction filter
    if (f.direction === "IN" && t.amountCents <= 0) return false;
    if (f.direction === "OUT" && t.amountCents > 0) return false;
    // date range (ISO string compare, inclusive)
    if (f.from !== undefined && t.date < f.from) return false;
    if (f.to !== undefined && t.date > f.to) return false;
    // search (case-insensitive substring on description)
    if (searchLower !== undefined && !t.description.toLowerCase().includes(searchLower)) return false;
    return true;
  });

  // Sort date DESC
  return filtered.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

// ---------- extractMerchant ----------

/** Strip trailing store/ref numbers (sequences of digits at end of string). */
function stripTrailingNumbers(s: string): string {
  return s.replace(/\s+\d+$/, "").trimEnd();
}

/**
 * Return a short, human-readable merchant label from a transaction description.
 * - Take the part before the first comma.
 * - Strip trailing store numbers.
 * - Trim whitespace.
 */
export function extractMerchant(description: string): string {
  // Take part before first comma
  const beforeComma = description.split(",")[0] ?? description;
  // Strip trailing store numbers
  const stripped = stripTrailingNumbers(beforeComma);
  return stripped.trim();
}
