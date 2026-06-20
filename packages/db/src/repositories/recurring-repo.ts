import { eq, ne } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { RecurringRepo, NewRecurring } from "@upshot/core";
import type { DetectedRecurring } from "@upshot/core";
import type { RecurringItem } from "@upshot/contracts";
import type { DbClient } from "../client";
import { recurringItems } from "../schema";

export class DrizzleRecurringRepo implements RecurringRepo {
  constructor(private readonly db: DbClient) {}

  async list(): Promise<RecurringItem[]> {
    return this.db.select().from(recurringItems).all() as RecurringItem[];
  }

  async listByStatus(status: RecurringItem["status"]): Promise<RecurringItem[]> {
    return this.db
      .select()
      .from(recurringItems)
      .where(eq(recurringItems.status, status))
      .all() as RecurringItem[];
  }

  async getById(id: string): Promise<RecurringItem | null> {
    return (
      (this.db
        .select()
        .from(recurringItems)
        .where(eq(recurringItems.id, id))
        .get() as RecurringItem | undefined) ?? null
    );
  }

  async create(input: NewRecurring): Promise<string> {
    const id = (input as { id?: string }).id ?? randomUUID();
    this.db
      .insert(recurringItems)
      .values({
        id,
        name: input.name,
        kind: input.kind,
        amountCents: input.amountCents,
        frequency: input.frequency,
        lastAmountCents: input.lastAmountCents ?? null,
        priceLastChangedAt: input.priceLastChangedAt ?? null,
        usageCount: input.usageCount ?? 0,
        usageResetAt: input.usageResetAt ?? null,
        category: input.category ?? null,
        merchant: input.merchant ?? null,
        status: input.status,
        matchRuleId: input.matchRuleId ?? null,
        nextExpectedDate: input.nextExpectedDate ?? null,
        lastDetectedDate: input.lastDetectedDate ?? null,
        firstDetectedDate: input.firstDetectedDate ?? null,
        accountId: input.accountId ?? null,
        isAutoDetected: input.isAutoDetected ?? false,
        notes: input.notes ?? null,
      })
      .run();
    return id;
  }

  async upsertSuggestion(d: DetectedRecurring): Promise<void> {
    // PATTERN KEY: name.trim().toLowerCase() — must match knownPatterns() derivation.
    // d.descriptionPattern is already name.trim().toLowerCase() from C1's detectRecurring.
    // We scan existing rows and compare their derived pattern to d.descriptionPattern.
    const allRows = this.db.select().from(recurringItems).all() as RecurringItem[];
    const existing = allRows.find(
      (r) => r.name.trim().toLowerCase() === d.descriptionPattern,
    );

    if (existing) {
      // Update detection-tracking fields only
      this.db
        .update(recurringItems)
        .set({
          amountCents: d.amountCents,
          lastDetectedDate: d.lastDate,
          nextExpectedDate: d.nextExpectedDate,
        })
        .where(eq(recurringItems.id, existing.id))
        .run();
    } else {
      this.db
        .insert(recurringItems)
        .values({
          id: randomUUID(),
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
        })
        .run();
    }
  }

  async setStatus(id: string, status: RecurringItem["status"]): Promise<void> {
    this.db
      .update(recurringItems)
      .set({ status })
      .where(eq(recurringItems.id, id))
      .run();
  }

  async applyDrift(
    id: string,
    newAmountCents: number,
    previousAmountCents: number,
    changedAt: string,
  ): Promise<void> {
    this.db
      .update(recurringItems)
      .set({
        amountCents: newAmountCents,
        lastAmountCents: previousAmountCents,
        priceLastChangedAt: changedAt,
      })
      .where(eq(recurringItems.id, id))
      .run();
  }

  async setUsage(id: string, usageCount: number, usageResetAt: string | null): Promise<void> {
    this.db
      .update(recurringItems)
      .set({ usageCount, usageResetAt })
      .where(eq(recurringItems.id, id))
      .run();
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
    const rows = this.db
      .select({ name: recurringItems.name })
      .from(recurringItems)
      .where(ne(recurringItems.status, "SUGGESTED"))
      .all();
    return new Set(rows.map((r) => r.name.trim().toLowerCase()));
  }

  async delete(id: string): Promise<void> {
    this.db.delete(recurringItems).where(eq(recurringItems.id, id)).run();
  }
}
