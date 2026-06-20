import { computeNetWorth } from "./index";

export interface MonthlySnapshotInput {
  month: string;                 // "YYYY-MM"
  incomeCents: number;           // already aggregated by the caller (>= 0)
  expenseCents: number;          // already aggregated, stored POSITIVE (>= 0)
  accountBalancesCents: number[];
  assets: { valueCents: number; includeInNetWorth: boolean }[];
  debts: { currentBalanceCents: number; includeInNetWorth: boolean }[];
}

export interface MonthlySnapshot {
  month: string;
  incomeCents: number;
  expenseCents: number;
  savedCents: number;            // DERIVED: incomeCents - expenseCents (may be negative)
  assetsCents: number;           // sum of includeInNetWorth asset valueCents
  debtCents: number;             // sum of includeInNetWorth debt currentBalanceCents
  netWorthCents: number;         // computeNetWorth({ accountBalancesCents, assets, debts })
}

export function computeMonthlySnapshot(input: MonthlySnapshotInput): MonthlySnapshot {
  const savedCents = input.incomeCents - input.expenseCents;

  const assetsCents = input.assets
    .filter((a) => a.includeInNetWorth)
    .reduce((sum, a) => sum + a.valueCents, 0);

  const debtCents = input.debts
    .filter((d) => d.includeInNetWorth)
    .reduce((sum, d) => sum + d.currentBalanceCents, 0);

  const netWorthCents = computeNetWorth(input);

  return {
    month: input.month,
    incomeCents: input.incomeCents,
    expenseCents: input.expenseCents,
    savedCents,
    assetsCents,
    debtCents,
    netWorthCents,
  };
}
