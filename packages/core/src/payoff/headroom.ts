/** Disposable income after expenses and debt minimums. May be negative. */
export function headroomCents(
  incomeCents: number,
  expenseCents: number,
  minimumsCents: number,
): number {
  return incomeCents - expenseCents - minimumsCents;
}
