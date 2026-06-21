import type { RecurringItem } from "@upshot/contracts";
import type { DetectedRecurring } from "../recurring/types";

/**
 * New-item input: computed/optional fields omitted (or overrideable).
 * Omits auto-managed fields; drift and usage cols are optional.
 */
export type NewRecurring = Omit<
  RecurringItem,
  "id" | "usageCount" | "usageResetAt" | "priceLastChangedAt" | "lastAmountCents"
> & {
  id?: string;
  // optional drift / usage cols (callers may supply initial values)
  usageCount?: number;
  usageResetAt?: string | null;
  priceLastChangedAt?: string | null;
  lastAmountCents?: number | null;
};

export interface RecurringRepo {
  list(): Promise<RecurringItem[]>;
  listByStatus(status: RecurringItem["status"]): Promise<RecurringItem[]>;
  getById(id: string): Promise<RecurringItem | null>;
  create(input: NewRecurring): Promise<string>;

  /**
   * Insert as SUGGESTED, or — if a row whose derived pattern already equals
   * d.descriptionPattern exists — update its lastDetectedDate / nextExpectedDate
   * / amountCents only.
   *
   * Pattern key derivation: name.trim().toLowerCase()
   * (see knownPatterns() for the consistency invariant).
   */
  upsertSuggestion(d: DetectedRecurring): Promise<void>;

  /** Accept (-> ACTIVE) or dismiss (-> CANCELLED). */
  setStatus(id: string, status: RecurringItem["status"]): Promise<void>;

  /** Override the bill-vs-subscription classification (user toggle). */
  setKind(id: string, kind: RecurringItem["kind"]): Promise<void>;

  /**
   * Persist drift computed upstream (by priceDrift in C1):
   * set amountCents = newAmountCents, lastAmountCents = previousAmountCents,
   * priceLastChangedAt = changedAt. No drift logic here.
   */
  applyDrift(
    id: string,
    newAmountCents: number,
    previousAmountCents: number,
    changedAt: string,
  ): Promise<void>;

  setUsage(id: string, usageCount: number, usageResetAt: string | null): Promise<void>;

  /**
   * Returns the normalized pattern key for every NON-SUGGESTED item
   * (status ACTIVE, PAUSED, or CANCELLED).
   *
   * PATTERN KEY INVARIANT: derived as `name.trim().toLowerCase()`.
   * Because `name` stores the original-cased displayName from C1's
   * DetectedRecurring, lowercasing it reproduces exactly the
   * `descriptionPattern` that C1's detectRecurring uses. This means:
   *   - A CANCELLED (dismissed) item suppresses re-suggestion.
   *   - An ACTIVE (accepted) item suppresses re-suggestion.
   *   - Only SUGGESTED items (pending review) do NOT block detection.
   * Both upsertSuggestion's existence-check and this method MUST use
   * `name.trim().toLowerCase()` — never the raw name — as the key.
   */
  knownPatterns(): Promise<Set<string>>;

  delete(id: string): Promise<void>;
}
