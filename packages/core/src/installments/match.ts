import type {
  InstallmentPlanInput,
  MatchableTransaction,
  InstallmentMatch,
  PlanUpdate,
} from "./types";

export const BNPL_RECENT_MATCH_WINDOW_DAYS = 45;

/** Adds `n` days to an ISO date string (date part only, e.g. "2026-06-01"). */
function addDays(isoDate: string, n: number): string {
  const [y, m, d] = isoDate.split("-").map(Number) as [number, number, number];
  // Use UTC to avoid DST issues
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + n);
  const yy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/**
 * Links bank transactions to installment plan installments.
 *
 * Key correctness properties:
 * - Idempotent: transactions in `alreadyLinkedTxIds` are never re-matched.
 * - Integer cents only — no parseFloat.
 * - Only ACTIVE plans are matched.
 * - Tolerance defaults to ±10% of installmentCents.
 */
export function matchInstallments(
  plans: InstallmentPlanInput[],
  transactions: MatchableTransaction[],
  alreadyLinkedTxIds: Set<string>,
  opts?: { amountTolerance?: number; recentWindowDays?: number; now?: string },
): { matches: InstallmentMatch[]; planUpdates: PlanUpdate[] } {
  const tol = opts?.amountTolerance ?? 0.1;
  const windowCutoff =
    opts?.recentWindowDays != null && opts?.now != null
      ? addDays(opts.now, -opts.recentWindowDays)
      : null;
  const matches: InstallmentMatch[] = [];
  const planUpdates: PlanUpdate[] = [];

  for (const plan of plans) {
    if (plan.status !== "ACTIVE") continue;

    const remaining = plan.totalInstallments - plan.installmentsPaid;
    if (remaining <= 0) continue;

    const low = Math.round(plan.installmentCents * (1 - tol));
    const high = Math.round(plan.installmentCents * (1 + tol));
    const merchantLower = plan.merchant.toLowerCase();

    // Find candidate transactions
    const candidates = transactions
      .filter(tx => {
        if (tx.isTransfer) return false;
        if (alreadyLinkedTxIds.has(tx.id)) return false;
        if (!tx.description.toLowerCase().includes(merchantLower)) return false;
        const abs = Math.abs(tx.amountCents);
        if (abs < low || abs > high) return false;
        if (windowCutoff !== null) {
          const txDate = (tx.settledAt ?? tx.createdAt).slice(0, 10);
          if (txDate < windowCutoff) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const ta = a.settledAt ?? a.createdAt;
        const tb = b.settledAt ?? b.createdAt;
        return ta < tb ? -1 : ta > tb ? 1 : 0;
      })
      .slice(0, remaining);

    if (candidates.length === 0) continue;

    let dueIndex = plan.installmentsPaid;
    let nextDueDate = plan.nextDueDate;

    for (const tx of candidates) {
      dueIndex += 1;
      matches.push({
        planId: plan.id,
        transactionId: tx.id,
        dueIndex,
        paidAt: tx.settledAt ?? tx.createdAt,
      });
      nextDueDate = addDays(nextDueDate, plan.frequencyDays);
    }

    const installmentsPaid = plan.installmentsPaid + candidates.length;
    const status: "ACTIVE" | "COMPLETE" =
      installmentsPaid >= plan.totalInstallments ? "COMPLETE" : "ACTIVE";

    planUpdates.push({
      planId: plan.id,
      installmentsPaid,
      nextDueDate,
      status,
    });
  }

  return { matches, planUpdates };
}

/**
 * Returns progress metrics for a plan. Pure calculation, integer cents only.
 */
export function planProgress(plan: {
  installmentCents: number;
  totalInstallments: number;
  installmentsPaid: number;
}): {
  paidCents: number;
  totalCents: number;
  remainingCents: number;
  percentComplete: number;
} {
  const totalCents = plan.installmentCents * plan.totalInstallments;
  const paidCents = plan.installmentCents * plan.installmentsPaid;
  const remainingCents = totalCents - paidCents;
  const percentComplete =
    plan.totalInstallments === 0
      ? 0
      : Math.round((plan.installmentsPaid / plan.totalInstallments) * 100);
  return { paidCents, totalCents, remainingCents, percentComplete };
}
