export function utilisation(
  balanceCents: number,
  creditLimitCents: number | null,
): number | null {
  return creditLimitCents && creditLimitCents > 0
    ? balanceCents / creditLimitCents
    : null;
}
