import { monthsBetween } from "../debt/months";
import type { PlanStatus } from "./types";

export interface EvaluatePlanStatusArgs {
  expectedBalanceCents: number;
  currentBalanceCents: number;
  projectedDebtFreeMonth: string | null;
  recomputedDebtFreeMonth: string | null;
  committedThisMonthCents: number;
  actualPaidThisMonthCents: number;
  toleranceCents?: number;
}

/** Signed month delta: recomputed − projected (negative = earlier than planned). */
function signedSlip(projected: string | null, recomputed: string | null): number {
  if (projected == null || recomputed == null) return 0;
  if (recomputed >= projected) return monthsBetween(projected, recomputed);
  return -monthsBetween(recomputed, projected);
}

export function evaluatePlanStatus(args: EvaluatePlanStatusArgs): PlanStatus {
  const tolerance = args.toleranceCents ?? 0;
  const balanceGapCents = args.expectedBalanceCents - args.currentBalanceCents;
  const contributionsShortfallCents = Math.max(
    0,
    args.committedThisMonthCents - args.actualPaidThisMonthCents,
  );

  let status: PlanStatus["status"];
  if (args.currentBalanceCents > args.expectedBalanceCents + tolerance) {
    status = "behind"; // balances-behind wins (precedence)
  } else if (args.currentBalanceCents < args.expectedBalanceCents - tolerance) {
    status = "ahead";
  } else {
    status = "on-track";
  }

  return {
    status,
    balanceGapCents,
    slipMonths: signedSlip(args.projectedDebtFreeMonth, args.recomputedDebtFreeMonth),
    contributionsShortfallCents,
  };
}
