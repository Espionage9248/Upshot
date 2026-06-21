import type { DebtStrategy, PayoffDebtInput } from "./types";

/** Returns debt ids in payoff priority order (target first). Pure, stable. */
export function orderByStrategy(
  debts: PayoffDebtInput[],
  strategy: DebtStrategy,
  customOrder?: string[],
): string[] {
  if (strategy === "CUSTOM" && customOrder && customOrder.length > 0) {
    const rank = new Map(customOrder.map((id, i) => [id, i]));
    return [...debts]
      .sort((a, b) => (rank.get(a.id) ?? 999) - (rank.get(b.id) ?? 999))
      .map((d) => d.id);
  }
  if (strategy === "AVALANCHE") {
    return [...debts]
      .sort((a, b) => (b.interestRate ?? 0) - (a.interestRate ?? 0))
      .map((d) => d.id);
  }
  // SNOWBALL (and CUSTOM with no order) → smallest balance first
  return [...debts]
    .sort((a, b) => a.currentBalanceCents - b.currentBalanceCents)
    .map((d) => d.id);
}
