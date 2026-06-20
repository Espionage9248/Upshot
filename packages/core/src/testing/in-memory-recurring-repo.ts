import { randomUUID } from "node:crypto";
import type { RecurringItem } from "@upshot/contracts";
import type { DetectedRecurring } from "../recurring/types";
import type { RecurringRepo, NewRecurring } from "../ports/recurring-repo";

export class InMemoryRecurringRepo implements RecurringRepo {
  private readonly store = new Map<string, RecurringItem>();

  async list(): Promise<RecurringItem[]> {
    return [...this.store.values()];
  }

  async listByStatus(status: RecurringItem["status"]): Promise<RecurringItem[]> {
    return [...this.store.values()].filter((r) => r.status === status);
  }

  async getById(id: string): Promise<RecurringItem | null> {
    return this.store.get(id) ?? null;
  }

  async create(input: NewRecurring): Promise<string> {
    const id = (input as { id?: string }).id ?? randomUUID();
    this.store.set(id, {
      ...input,
      id,
      usageCount: input.usageCount ?? 0,
      usageResetAt: input.usageResetAt ?? null,
      priceLastChangedAt: input.priceLastChangedAt ?? null,
      lastAmountCents: input.lastAmountCents ?? null,
    });
    return id;
  }

  async upsertSuggestion(d: DetectedRecurring): Promise<void> {
    // PATTERN KEY: name.trim().toLowerCase() — must match knownPatterns() derivation.
    // d.descriptionPattern is already name.trim().toLowerCase() from C1's detectRecurring.
    // We find an existing row by comparing name.trim().toLowerCase() to d.descriptionPattern.
    const existing = [...this.store.values()].find(
      (r) => r.name.trim().toLowerCase() === d.descriptionPattern,
    );

    if (existing) {
      // Update detection-tracking fields only
      this.store.set(existing.id, {
        ...existing,
        amountCents: d.amountCents,
        lastDetectedDate: d.lastDate,
        nextExpectedDate: d.nextExpectedDate,
      });
    } else {
      const id = randomUUID();
      this.store.set(id, {
        id,
        name: d.displayName,
        kind: "SUBSCRIPTION",
        amountCents: d.amountCents,
        frequency: d.frequency,
        lastAmountCents: null,
        priceLastChangedAt: null,
        usageCount: 0,
        usageResetAt: null,
        category: d.category,
        merchant: d.merchant,
        status: "SUGGESTED",
        matchRuleId: null,
        nextExpectedDate: d.nextExpectedDate,
        lastDetectedDate: d.lastDate,
        firstDetectedDate: d.firstDate,
        accountId: d.accountId,
        isAutoDetected: true,
        notes: null,
      });
    }
  }

  async setStatus(id: string, status: RecurringItem["status"]): Promise<void> {
    const existing = this.store.get(id);
    if (!existing) return;
    this.store.set(id, { ...existing, status });
  }

  async applyDrift(
    id: string,
    newAmountCents: number,
    previousAmountCents: number,
    changedAt: string,
  ): Promise<void> {
    const existing = this.store.get(id);
    if (!existing) return;
    this.store.set(id, {
      ...existing,
      amountCents: newAmountCents,
      lastAmountCents: previousAmountCents,
      priceLastChangedAt: changedAt,
    });
  }

  async setUsage(id: string, usageCount: number, usageResetAt: string | null): Promise<void> {
    const existing = this.store.get(id);
    if (!existing) return;
    this.store.set(id, { ...existing, usageCount, usageResetAt });
  }

  /**
   * Returns the normalized pattern key for every NON-SUGGESTED item.
   *
   * PATTERN KEY INVARIANT: derived as `name.trim().toLowerCase()`.
   * This reproduces C1's descriptionPattern so dismissed/accepted items
   * suppress re-detection. Only SUGGESTED items are excluded (they are
   * still pending review and should not block detection).
   */
  async knownPatterns(): Promise<Set<string>> {
    const patterns = new Set<string>();
    for (const r of this.store.values()) {
      if (r.status !== "SUGGESTED") {
        patterns.add(r.name.trim().toLowerCase());
      }
    }
    return patterns;
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}
