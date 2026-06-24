/**
 * Pure debt persistence (db-injected). Local-only.
 *
 * Kept out of the "use server" module so these helpers are NOT registered as
 * client-callable Server Actions. The thin auth-guarded wrappers live in
 * `debts.ts` (same split as savers-core.ts / savers.ts).
 */

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { DrizzleDebtRepo, tables, type DbClient } from "@upshot/db";
import type { NewDebt, RecordDebtPayment } from "@upshot/core";

/** Create input: id is optional (auto-generated when absent). */
export type CreateDebtInput = Omit<NewDebt, "id"> & { id?: string; paymentPatterns?: string[] };

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Append an event_log entry. */
function logEvent(
  db: DbClient,
  action: string,
  entityId: string,
  description: string,
  meta: Record<string, unknown>,
): void {
  db.insert(tables.eventLog)
    .values({
      id: randomUUID(),
      category: "debt",
      action,
      entityType: "debt",
      entityId,
      description,
      meta,
    })
    .run();
}

// Re-export Debt row type (avoids @upshot/contracts import in callers).
export type DebtRow = Awaited<ReturnType<DrizzleDebtRepo["list"]>>[number];

// ---------------------------------------------------------------------------
// upsertDebtPaymentRule
// ---------------------------------------------------------------------------

// NOTE: retained only for the createDebt/updateDebt `paymentPatterns` convenience input.
// It sets matchRuleId directly and does NOT stamp paymentsLinkedAt (stays null → conservative
// no-decrement). The canonical debt-payment link path is the RuleEditor → saveRule (Task 7).
export function upsertDebtPaymentRule(
  db: DbClient,
  debtId: string,
  debtName: string,
  patterns: string[],
): string {
  const trimmed = patterns.map((p) => p.trim()).filter(Boolean);
  if (trimmed.length === 0) throw new Error("upsertDebtPaymentRule: no non-empty patterns");

  const ruleId = randomUUID();
  db.insert(tables.matchRules)
    .values({ id: ruleId, name: `Debt payments: ${debtName}`, isActive: true, priority: 50 })
    .run();

  for (const value of trimmed) {
    db.insert(tables.matchConditions)
      .values({ id: randomUUID(), ruleId, field: "description", mode: "contains", value })
      .run();
  }

  db.update(tables.debts).set({ matchRuleId: ruleId }).where(eq(tables.debts.id, debtId)).run();

  return ruleId;
}

// ---------------------------------------------------------------------------
// createDebt
// ---------------------------------------------------------------------------

/** Create a debt and write an event_log row. Returns the new debt id. */
export async function createDebt(
  db: DbClient,
  input: CreateDebtInput,
): Promise<string> {
  const { paymentPatterns, ...rest } = input;
  const repo = new DrizzleDebtRepo(db);
  // The repo generates an id when input.id is absent; cast to satisfy its type.
  const id = await repo.create(rest as Parameters<typeof repo.create>[0]);
  if (paymentPatterns && paymentPatterns.length > 0) {
    upsertDebtPaymentRule(db, id, input.name, paymentPatterns);
  }
  logEvent(db, "create_debt", id, `Created debt: ${input.name}`, {
    name: input.name,
    type: input.type,
    currentBalanceCents: input.currentBalanceCents,
  });
  return id;
}

// ---------------------------------------------------------------------------
// updateDebt
// ---------------------------------------------------------------------------

/** Update a debt and write an event_log row. */
export async function updateDebt(
  db: DbClient,
  input: DebtRow & { paymentPatterns?: string[] },
): Promise<void> {
  const { paymentPatterns, ...rest } = input;
  const repo = new DrizzleDebtRepo(db);
  await repo.update(rest);
  if (paymentPatterns && paymentPatterns.length > 0) {
    upsertDebtPaymentRule(db, input.id, input.name, paymentPatterns);
  }
  logEvent(db, "update_debt", input.id, `Updated debt: ${input.name}`, {
    name: input.name,
    currentBalanceCents: input.currentBalanceCents,
  });
}

// ---------------------------------------------------------------------------
// deleteDebt
// ---------------------------------------------------------------------------

/** Delete a debt and write an event_log row. */
export async function deleteDebt(db: DbClient, id: string): Promise<void> {
  const repo = new DrizzleDebtRepo(db);
  await repo.delete(id);
  logEvent(db, "delete_debt", id, `Deleted debt ${id}`, { id });
}

// ---------------------------------------------------------------------------
// recordDebtPayment
// ---------------------------------------------------------------------------

/** Record a payment against a debt and write an event_log row. */
export async function recordDebtPayment(
  db: DbClient,
  payment: RecordDebtPayment,
): Promise<void> {
  const repo = new DrizzleDebtRepo(db);
  await repo.recordPayment(payment);
  logEvent(
    db,
    "record_payment",
    payment.debtId,
    `Recorded payment of ${payment.amountCents} cents on debt ${payment.debtId}`,
    {
      amountCents: payment.amountCents,
      paymentDate: payment.paymentDate,
    },
  );
}

