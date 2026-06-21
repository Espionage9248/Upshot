/**
 * Rolls up BNPL installment plans to produce a single summary of remaining
 * exposure. Only ACTIVE plans contribute to the totals.
 */
export function bnplRollup(
  plans: {
    totalInstallments: number;
    installmentsPaid: number;
    installmentCents: number;
    status: string;
    nextDueDate: string;
  }[],
): { remainingCents: number; activeCount: number; nextDueDate: string | null } {
  const active = plans.filter(p => p.status === "ACTIVE");

  const remainingCents = active.reduce(
    (sum, p) => sum + (p.totalInstallments - p.installmentsPaid) * p.installmentCents,
    0,
  );

  const nextDueDate =
    active.length === 0
      ? null
      : active.reduce(
          (min, p) => (p.nextDueDate < min ? p.nextDueDate : min),
          active[0]!.nextDueDate,
        );

  return { remainingCents, activeCount: active.length, nextDueDate };
}
