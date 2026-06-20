import { DrizzleInstallmentRepo, type DbClient } from "@upshot/db";
import { planProgress } from "@upshot/core";

/** Installment plan row as returned by the repo — avoids a direct @upshot/contracts dep in apps/web. */
export type InstallmentRow = Awaited<ReturnType<DrizzleInstallmentRepo["list"]>>[number];

export interface InstallmentsData {
  active: { row: InstallmentRow; progress: { remainingCents: number; percentComplete: number } }[];
  complete: InstallmentRow[];
}

/**
 * Server-only loader for the Installments surface. Reads the encrypted DB in-process
 * via injected `db`. Returns domain data only — no @upshot/contracts import.
 */
export async function loadInstallmentsData(db: DbClient): Promise<InstallmentsData> {
  const repo = new DrizzleInstallmentRepo(db);
  const rows = await repo.list();

  const active: InstallmentsData["active"] = [];
  const complete: InstallmentRow[] = [];

  for (const row of rows) {
    if (row.status === "COMPLETE") {
      complete.push(row);
    } else {
      const p = planProgress(row);
      active.push({
        row,
        progress: {
          remainingCents: p.remainingCents,
          percentComplete: p.percentComplete,
        },
      });
    }
  }

  return { active, complete };
}
