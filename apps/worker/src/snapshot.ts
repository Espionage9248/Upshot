import { randomUUID } from "node:crypto";
import type { JobRunRepo } from "@upshot/core";
import { computeMonthlySnapshot } from "@upshot/core";
import {
  DrizzleAccountRepo, DrizzleAssetRepo, tables, type DbClient,
} from "@upshot/db";

/**
 * Compute and upsert the monthly net-worth snapshot for the previous complete
 * calendar month. Idempotent (keyed on month via snapshots_month_uq index).
 *
 * By design: account/asset/debt balances are point-in-time current values at
 * run time, not month-end historical — Upshot has no historical balance store.
 * Only income/expense/saved are truly month-scoped.
 */
export async function runSnapshotOnce(deps: {
  db: DbClient;
  jobRuns: JobRunRepo;
  now?: () => Date;
  newId?: () => string;
}): Promise<string> {
  const newId = deps.newId ?? (() => randomUUID());
  const now = deps.now ?? (() => new Date());
  const id = newId();

  await deps.jobRuns.create({ id, job: "SNAPSHOT", startedAt: now().toISOString() });

  try {
    // Target month = the previous complete calendar month relative to now().
    // Cron fires 0 4 1 * * (04:00 on the 1st), closing out the just-finished month.
    const nowDate = now();
    const year = nowDate.getUTCFullYear();
    const month = nowDate.getUTCMonth(); // 0-based: Jan=0, Dec=11
    // Decrement by one month (handles Jan → prev Dec automatically)
    const prevIdx = year * 12 + month - 1;
    const prevYear = Math.floor(prevIdx / 12);
    const prevMonth = prevIdx - prevYear * 12 + 1; // back to 1-based
    const targetMonth = `${prevYear}-${String(prevMonth).padStart(2, "0")}`;

    // Aggregate income/expense for the target month from transactions.
    // Exclude transfers. Sign convention: positive amountCents = income,
    // negative amountCents = expense (stored positive per budget/data.ts precedent).
    const txRows = deps.db
      .select({
        amountCents: tables.transactions.amountCents,
        createdAt: tables.transactions.createdAt,
        isTransfer: tables.transactions.isTransfer,
      })
      .from(tables.transactions)
      .all();

    let incomeCents = 0;
    let expenseCents = 0;
    for (const row of txRows) {
      if (row.isTransfer) continue;
      if (row.createdAt.slice(0, 7) !== targetMonth) continue;
      if (row.amountCents > 0) {
        incomeCents += row.amountCents;
      } else if (row.amountCents < 0) {
        expenseCents += Math.abs(row.amountCents);
      }
    }

    // Gather point-in-time balances (current values at run time).
    const accountRows = await new DrizzleAccountRepo(deps.db).list();
    const accountBalancesCents = accountRows.map((a) => a.balanceCents);

    const assetRows = await new DrizzleAssetRepo(deps.db).list();
    const assetInputs = assetRows.map((a) => ({
      valueCents: a.valueCents,
      includeInNetWorth: a.includeInNetWorth,
    }));

    const debtRows = deps.db
      .select({
        currentBalanceCents: tables.debts.currentBalanceCents,
        includeInNetWorth: tables.debts.includeInNetWorth,
      })
      .from(tables.debts)
      .all();

    const snapshot = computeMonthlySnapshot({
      month: targetMonth,
      incomeCents,
      expenseCents,
      accountBalancesCents,
      assets: assetInputs,
      debts: debtRows,
    });

    // Upsert into monthly_snapshots keyed by month (snapshots_month_uq unique index).
    // On conflict, update figures but keep existing id/createdAt.
    deps.db
      .insert(tables.monthlySnapshots)
      .values({
        id: newId(),
        month: snapshot.month,
        incomeCents: snapshot.incomeCents,
        expenseCents: snapshot.expenseCents,
        savedCents: snapshot.savedCents,
        debtCents: snapshot.debtCents,
        assetsCents: snapshot.assetsCents,
        netWorthCents: snapshot.netWorthCents,
      })
      .onConflictDoUpdate({
        target: tables.monthlySnapshots.month,
        set: {
          incomeCents: snapshot.incomeCents,
          expenseCents: snapshot.expenseCents,
          savedCents: snapshot.savedCents,
          debtCents: snapshot.debtCents,
          assetsCents: snapshot.assetsCents,
          netWorthCents: snapshot.netWorthCents,
        },
      })
      .run();

    await deps.jobRuns.finish(id, {
      status: "SUCCESS",
      finishedAt: now().toISOString(),
      cursor: targetMonth,
      counts: { netWorthCents: snapshot.netWorthCents },
      error: null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await deps.jobRuns.finish(id, {
      status: "FAILED",
      finishedAt: now().toISOString(),
      cursor: null,
      counts: null,
      error: message,
    });
  }

  return id;
}
