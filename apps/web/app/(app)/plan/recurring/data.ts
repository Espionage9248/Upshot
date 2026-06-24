import { DrizzleRecurringRepo, DrizzleDebtRepo, type DbClient } from "@upshot/db";
import {
  toMonthlyCostCents,
  findOverlaps,
  effectiveDebtPaymentCents,
  type OverlapGroup,
} from "@upshot/core";

/** Recurring item row as returned by the repo — avoids a direct @upshot/contracts dep in apps/web. */
export type RecurringRow = Awaited<ReturnType<DrizzleRecurringRepo["list"]>>[number];

export interface RecurringData {
  active: RecurringRow[];
  paused: RecurringRow[];
  suggested: RecurringRow[];
  monthlyTotalCents: number;
  overlaps: OverlapGroup[];
  driftAlerts: { id: string; name: string; previousAmountCents: number; amountCents: number }[];
  debtPayments: { count: number; totalCents: number };
}

/**
 * Server-only loader for the Recurring surface. Reads the encrypted DB in-process
 * via injected `db`. Returns domain data only — no @upshot/contracts import.
 */
export async function loadRecurringData(db: DbClient): Promise<RecurringData> {
  const repo = new DrizzleRecurringRepo(db);
  const rows = await repo.list();

  const active: RecurringRow[] = [];
  const paused: RecurringRow[] = [];
  const suggested: RecurringRow[] = [];

  for (const row of rows) {
    if (row.status === "ACTIVE") active.push(row);
    else if (row.status === "PAUSED") paused.push(row);
    else if (row.status === "SUGGESTED") suggested.push(row);
    // CANCELLED rows are intentionally excluded from the UI
  }

  // Monthly total: sum of toMonthlyCostCents over ACTIVE items only
  const monthlyTotalCents = active.reduce(
    (sum, row) => sum + toMonthlyCostCents(row.amountCents, row.frequency),
    0,
  );

  // Overlap groups: find duplicates by category or merchant among ACTIVE items
  const overlaps = findOverlaps(
    active.map((row) => ({ id: row.id, category: row.category, merchant: row.merchant })),
  );

  // Drift alerts: ACTIVE items where priceLastChangedAt is set AND lastAmountCents differs from amountCents
  const driftAlerts = active
    .filter(
      (row) =>
        row.priceLastChangedAt !== null &&
        row.lastAmountCents !== null &&
        row.lastAmountCents !== row.amountCents,
    )
    .map((row) => ({
      id: row.id,
      name: row.name,
      previousAmountCents: row.lastAmountCents as number,
      amountCents: row.amountCents,
    }));

  // Debt payments are owned by their debt (Approach A): summarise read-only here.
  const debtRepo = new DrizzleDebtRepo(db);
  const debtRows = await debtRepo.list();
  const latest = await debtRepo.latestPaymentCentsByDebt();
  let debtCount = 0;
  let debtTotalCents = 0;
  for (const row of debtRows) {
    const actual = latest.get(row.id)?.amountCents ?? null;
    const eff = effectiveDebtPaymentCents({
      actualPaymentCents: actual,
      minimumPaymentCents: row.minimumPaymentCents ?? null,
      monthlyPaymentCents: row.monthlyPaymentCents,
    });
    if (eff > 0) {
      debtCount++;
      debtTotalCents += eff;
    }
  }

  return { active, paused, suggested, monthlyTotalCents, overlaps, driftAlerts, debtPayments: { count: debtCount, totalCents: debtTotalCents } };
}
