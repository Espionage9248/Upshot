/**
 * Pure debt persistence (db-injected). Local-only.
 *
 * Kept out of the "use server" module so these helpers are NOT registered as
 * client-callable Server Actions. The thin auth-guarded wrappers live in
 * `debts.ts` (same split as savers-core.ts / savers.ts).
 */

import { randomUUID } from "node:crypto";
import { DrizzleDebtRepo, tables, type DbClient } from "@upshot/db";
import type { NewDebt, RecordDebtPayment } from "@upshot/core";

/** Create input: id is optional (auto-generated when absent). */
export type CreateDebtInput = Omit<NewDebt, "id"> & { id?: string };

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
// createDebt
// ---------------------------------------------------------------------------

/** Create a debt and write an event_log row. Returns the new debt id. */
export async function createDebt(
  db: DbClient,
  input: CreateDebtInput,
): Promise<string> {
  const repo = new DrizzleDebtRepo(db);
  // The repo generates an id when input.id is absent; cast to satisfy its type.
  const id = await repo.create(input as Parameters<typeof repo.create>[0]);
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
export async function updateDebt(db: DbClient, input: DebtRow): Promise<void> {
  const repo = new DrizzleDebtRepo(db);
  await repo.update(input);
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
