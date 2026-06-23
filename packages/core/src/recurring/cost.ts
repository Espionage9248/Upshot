import type { Frequency } from "./types";

/**
 * Normalize a per-charge amount to monthly cost.
 * Returns an integer (rounded).
 */
export function toMonthlyCostCents(amountCents: number, frequency: Frequency): number {
  switch (frequency) {
    case "WEEKLY":
      return Math.round((amountCents * 52) / 12);
    case "FORTNIGHTLY":
      return Math.round((amountCents * 26) / 12);
    case "MONTHLY":
      return amountCents;
    case "QUARTERLY":
      return Math.round(amountCents / 3);
    case "YEARLY":
      return Math.round(amountCents / 12);
  }
}
