import type { DbClient } from "@upshot/db";
import { loadDebtsData } from "./debts/data";
import { loadInstallmentsData } from "./installments/data";
import { loadRecurringData } from "./recurring/data";

export interface PlanHubData {
  debtTotalCents: number;
  debtFreeMonth: string | null;
  nextBnpl: { merchant: string; nextDueDate: string; installmentCents: number } | null;
  upcomingRecurring: { name: string; nextExpectedDate: string; amountCents: number }[];
  recurringMonthlyTotalCents: number;
}

/**
 * Server-only loader for the Plan hub. Delegates to the three section loaders
 * so aggregated totals never drift from their respective detail views.
 */
export async function loadPlanHubData(
  db: DbClient,
  now: Date = new Date(),
): Promise<PlanHubData> {
  const [debtsData, installmentsData, recurringData] = await Promise.all([
    loadDebtsData(db, now),
    loadInstallmentsData(db),
    loadRecurringData(db),
  ]);

  // Σ currentBalanceCents for debts that are flagged includeInNetWorth
  const debtTotalCents = debtsData.debts
    .filter((d) => d.row.includeInNetWorth)
    .reduce((sum, d) => sum + d.row.currentBalanceCents, 0);

  const debtFreeMonth = debtsData.analysis.debtFreeMonth;

  // Earliest nextDueDate among ACTIVE installment plans (loadInstallmentsData already partitions)
  let nextBnpl: PlanHubData["nextBnpl"] = null;
  for (const { row } of installmentsData.active) {
    if (nextBnpl === null || row.nextDueDate < nextBnpl.nextDueDate) {
      nextBnpl = {
        merchant: row.merchant,
        nextDueDate: row.nextDueDate,
        installmentCents: row.installmentCents,
      };
    }
  }

  // ACTIVE recurring items due within the next 30 days (inclusive), sorted by date
  const windowEnd = new Date(now);
  windowEnd.setDate(windowEnd.getDate() + 30);
  const windowEndStr = windowEnd.toISOString().slice(0, 10);
  const nowStr = now.toISOString().slice(0, 10);

  const upcomingRecurring = recurringData.active
    .filter(
      (row) =>
        row.nextExpectedDate !== null &&
        row.nextExpectedDate >= nowStr &&
        row.nextExpectedDate <= windowEndStr,
    )
    .sort((a, b) => (a.nextExpectedDate! < b.nextExpectedDate! ? -1 : 1))
    .map((row) => ({
      name: row.name,
      nextExpectedDate: row.nextExpectedDate as string,
      amountCents: row.amountCents,
    }));

  return {
    debtTotalCents,
    debtFreeMonth,
    nextBnpl,
    upcomingRecurring,
    recurringMonthlyTotalCents: recurringData.monthlyTotalCents,
  };
}
