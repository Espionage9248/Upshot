/**
 * Net-worth computation.
 *
 * Pure function — no side effects, no I/O. Integer cents throughout.
 *
 * Formula: Σ accountBalancesCents + Σ assets(includeInNetWorth).valueCents
 *          − Σ debts(includeInNetWorth).currentBalanceCents
 */

export interface NetWorthInput {
  accountBalancesCents: number[];
  assets: { valueCents: number; includeInNetWorth: boolean }[];
  debts: { currentBalanceCents: number; includeInNetWorth: boolean }[];
}

export function computeNetWorth(input: NetWorthInput): number {
  const bankTotal = input.accountBalancesCents.reduce((sum, b) => sum + b, 0);
  const assetTotal = input.assets
    .filter((a) => a.includeInNetWorth)
    .reduce((sum, a) => sum + a.valueCents, 0);
  const debtTotal = input.debts
    .filter((d) => d.includeInNetWorth)
    .reduce((sum, d) => sum + d.currentBalanceCents, 0);
  return bankTotal + assetTotal - debtTotal;
}
