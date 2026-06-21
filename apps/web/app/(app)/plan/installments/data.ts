import { DrizzleInstallmentRepo, type DbClient } from "@upshot/db";
import { planProgress } from "@upshot/core";

/** Installment plan row as returned by the repo — avoids a direct @upshot/contracts dep in apps/web. */
export type InstallmentRow = Awaited<ReturnType<DrizzleInstallmentRepo["list"]>>[number];

/** A plan row plus its display category derived from the matched transactions. */
export type InstallmentRowView = InstallmentRow & { category: string | null };

export interface InstallmentsData {
  active: { row: InstallmentRowView; progress: { remainingCents: number; percentComplete: number } }[];
  complete: InstallmentRowView[];
}

/** Most frequent name (ties → first to reach the max). Null for an empty list. */
function mostCommon(names: string[]): string | null {
  const counts = new Map<string, number>();
  let best: string | null = null;
  let bestN = 0;
  for (const n of names) {
    const c = (counts.get(n) ?? 0) + 1;
    counts.set(n, c);
    if (c > bestN) {
      best = n;
      bestN = c;
    }
  }
  return best;
}

/**
 * Server-only loader for the Installments surface. Reads the encrypted DB in-process
 * via injected `db`. Returns domain data only — no @upshot/contracts import.
 */
export async function loadInstallmentsData(db: DbClient): Promise<InstallmentsData> {
  const repo = new DrizzleInstallmentRepo(db);
  const rows = await repo.list();

  const active: InstallmentsData["active"] = [];
  const complete: InstallmentRowView[] = [];

  for (const row of rows) {
    const category = mostCommon(await repo.categoriesForPlan(row.id));
    const view: InstallmentRowView = { ...row, category };
    if (row.status === "COMPLETE") {
      complete.push(view);
    } else {
      const p = planProgress(row);
      active.push({
        row: view,
        progress: {
          remainingCents: p.remainingCents,
          percentComplete: p.percentComplete,
        },
      });
    }
  }

  return { active, complete };
}
