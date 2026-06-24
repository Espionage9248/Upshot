/**
 * The single source of truth for a debt's effective monthly payment.
 *
 * "Actual payment" = the amount of the debt's latest matched debt_payment
 * (read in the loader, passed in here as actualPaymentCents). When present
 * (non-null, including 0) it wins; otherwise fall back to the typed
 * minimumPaymentCents, else the typed monthlyPaymentCents.
 *
 * Pure — no DB access. Integer cents only.
 */
export function effectiveDebtPaymentCents(args: {
  actualPaymentCents: number | null;
  minimumPaymentCents: number | null;
  monthlyPaymentCents: number;
}): number {
  if (args.actualPaymentCents !== null) return args.actualPaymentCents;
  return args.minimumPaymentCents ?? args.monthlyPaymentCents;
}
