import { and, eq } from "drizzle-orm";
import { buildTaxEstimate, type TaxEstimate, type DeductibleGroup } from "@upshot/core";
import { DrizzleCategoryRepo, tables, type DbClient } from "@upshot/db";
import { loadSettings } from "@/server-actions/settings-core";

// NOTE: SUPPORTED_FYS is currently [2026]. When a new financial year is supported,
// add the new year's brackets to packages/core/src/tax/brackets.ts.
const FALLBACK_FY = 2026;

export interface TaxData {
  estimate: TaxEstimate;
  fyLabel: string;
  daysToEofy: number;
  hasIncomeInputs: boolean;
}

/** FY ending year + window bounds (ISO) for `now`, given the FY start month (1-based). */
function fyWindow(
  now: string,
  startMonth: number,
): { endingYear: number; startISO: string; endISO: string } {
  const d = new Date(now);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1; // 1-based
  const endingYear = m >= startMonth ? y + 1 : y;
  const startISO = `${endingYear - 1}-${String(startMonth).padStart(2, "0")}-01T00:00:00.000Z`;
  // End = one millisecond before the same start month next FY.
  const endExclusive = new Date(Date.UTC(endingYear, startMonth - 1, 1));
  const endISO = new Date(endExclusive.getTime() - 1).toISOString();
  return { endingYear, startISO, endISO };
}

export async function loadTaxData(db: DbClient, opts: { now: string }): Promise<TaxData> {
  const settings = await loadSettings(db);
  const startMonth = settings?.financialYearStartMonth ?? 7;
  const medicareLevyApplies = settings?.medicareLevyApplies ?? true;
  const grossIncomeCents = settings?.taxableIncomeGrossCents ?? 0;
  const paygWithheldCents = settings?.paygWithheldCents ?? 0;

  const { endingYear, startISO, endISO } = fyWindow(opts.now, startMonth);

  // Clamp to FALLBACK_FY if the bracket table doesn't cover the real ending year.
  // The bracket table must gain new years annually (packages/core/src/tax/brackets.ts).
  const fy = endingYear <= FALLBACK_FY ? endingYear : FALLBACK_FY;

  // Category id → name for the fallback label when taxDeductionCategory is null.
  const categories = await new DrizzleCategoryRepo(db).list();
  const catName = new Map(categories.map((c) => [c.id, c.name]));

  // Settled, deductible txns — filter window in JS (avoids parameterised string compare issues).
  const rows = db
    .select({
      amountCents: tables.transactions.amountCents,
      taxDeductionCategory: tables.transactions.taxDeductionCategory,
      categoryId: tables.transactions.categoryId,
      settledAt: tables.transactions.settledAt,
      createdAt: tables.transactions.createdAt,
    })
    .from(tables.transactions)
    .where(
      and(
        eq(tables.transactions.isTaxDeductible, true),
        eq(tables.transactions.status, "SETTLED"),
      ),
    )
    .all();

  const groups = new Map<string, { cents: number; count: number }>();
  for (const r of rows) {
    const at = r.settledAt ?? r.createdAt;
    if (at < startISO || at > endISO) continue;
    const label =
      r.taxDeductionCategory ??
      (r.categoryId != null ? (catName.get(r.categoryId) ?? "Uncategorised") : "Uncategorised");
    const cents = Math.abs(r.amountCents); // deductible spend is an outflow
    const g = groups.get(label) ?? { cents: 0, count: 0 };
    g.cents += cents;
    g.count += 1;
    groups.set(label, g);
  }

  const deductibles: DeductibleGroup[] = Array.from(groups.entries()).map(([category, g]) => ({
    category,
    cents: g.cents,
    count: g.count,
  }));

  const estimate = buildTaxEstimate({
    grossIncomeCents,
    paygWithheldCents,
    deductibles,
    medicareLevyApplies,
    fy,
  });

  // Days to end of FY window.
  const daysToEofy = Math.max(
    0,
    Math.ceil((new Date(endISO).getTime() - new Date(opts.now).getTime()) / 86_400_000),
  );

  return {
    estimate,
    fyLabel: `FY${endingYear - 1}-${String(endingYear).slice(2)}`,
    daysToEofy,
    hasIncomeInputs: estimate.hasIncomeInputs,
  };
}
