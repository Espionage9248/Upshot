import { randomUUID } from "node:crypto";
import type { JobRunRepo } from "@upshot/core";
import { accrueFee } from "@upshot/core";
import { DrizzleDebtRepo } from "../repositories/debt-repo";
import type { DbClient } from "../client";

/**
 * Apply monthly fees to all debts that have a fee due and have not yet had a
 * fee applied in the current calendar month. Idempotency is enforced by
 * `accrueFee`'s yyyy-MM guard on lastFeeAppliedAt.
 *
 * Mirrors `runSnapshotOnce` job-run lifecycle: create → try/compute/finish
 * SUCCESS with counts → catch → finish FAILED.
 */
export async function runFeesOnce(deps: {
  db: DbClient;
  jobRuns: JobRunRepo;
  now?: () => Date;
}): Promise<string> {
  const now = deps.now ?? (() => new Date());
  const id = randomUUID();

  await deps.jobRuns.create({ id, job: "FEES", startedAt: now().toISOString() });

  try {
    const nowISO = now().toISOString();
    const debtRepo = new DrizzleDebtRepo(deps.db);
    const debts = await debtRepo.list();

    let feesApplied = 0;
    for (const debt of debts) {
      const result = accrueFee(
        {
          monthlyFeeCents: debt.monthlyFeeCents,
          feeDueDay: debt.feeDueDay,
          lastFeeAppliedAt: debt.lastFeeAppliedAt,
          currentBalanceCents: debt.currentBalanceCents,
        },
        nowISO,
      );
      if (result !== null) {
        await debtRepo.applyFee(debt.id, result.newBalanceCents, result.lastFeeAppliedAt);
        feesApplied++;
      }
    }

    await deps.jobRuns.finish(id, {
      status: "SUCCESS",
      finishedAt: now().toISOString(),
      cursor: now().toISOString().slice(0, 7),
      counts: { feesApplied },
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
