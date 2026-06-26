import { afterEach, beforeEach, describe, expect, it, test } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDbClient, applyMigrations, tables, DrizzleInstallmentRepo, type DbClient } from "@upshot/db";
import { buildInstallmentFromTransaction, createInstallmentFromTransaction, deleteInstallmentPlan, setInstallmentNotes } from "./installments-core";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function tempDbPath(): string {
  const dir = mkdtempSync(join(tmpdir(), "upshot-installments-core-"));
  dirs.push(dir);
  return join(dir, "test.db");
}

let db: DbClient;

beforeEach(() => {
  const client = createDbClient({ url: tempDbPath(), key: KEY });
  applyMigrations(client.db);
  db = client.db;
});

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

function installmentEventRows(action: string) {
  return db
    .select()
    .from(tables.eventLog)
    .all()
    .filter((e) => e.category === "installment" && e.action === action);
}

// ---------------------------------------------------------------------------
// deleteInstallmentPlan
// ---------------------------------------------------------------------------

describe("deleteInstallmentPlan", () => {
  it("removes the plan and writes an event_log entry", async () => {
    const repo = new DrizzleInstallmentRepo(db);
    const id = await repo.create({
      merchant: "Laybuy",
      totalCents: 6000,
      installmentCents: 1000,
      totalInstallments: 6,
      installmentsPaid: 0,
      frequencyDays: 7,
      firstDueDate: "2026-06-20",
      nextDueDate: "2026-06-20",
      status: "ACTIVE",
      matchRuleId: null,
      notes: null,
    });

    await deleteInstallmentPlan(db, id);

    expect(db.select().from(tables.installmentPlans).all()).toHaveLength(0);

    const logs = installmentEventRows("delete_installment_plan");
    expect(logs).toHaveLength(1);
    expect(logs[0]!.entityId).toBe(id);
  });
});

// ---------------------------------------------------------------------------
// setInstallmentNotes
// ---------------------------------------------------------------------------

describe("setInstallmentNotes", () => {
  it("updates the plan note and writes an event_log entry", async () => {
    const repo = new DrizzleInstallmentRepo(db);
    const id = await repo.create({
      merchant: "Zip", totalCents: 8000, installmentCents: 2000, totalInstallments: 4,
      installmentsPaid: 1, frequencyDays: 14, firstDueDate: "2026-06-01",
      nextDueDate: "2026-06-15", status: "ACTIVE", matchRuleId: null, notes: null,
    });

    await setInstallmentNotes(db, id, "for the new couch");

    expect((await repo.getById(id))?.notes).toBe("for the new couch");
    const logs = installmentEventRows("set_installment_notes");
    expect(logs).toHaveLength(1);
    expect(logs[0]!.entityId).toBe(id);
  });

  it("clears the note when given null", async () => {
    const repo = new DrizzleInstallmentRepo(db);
    const id = await repo.create({
      merchant: "Zip", totalCents: 8000, installmentCents: 2000, totalInstallments: 4,
      installmentsPaid: 1, frequencyDays: 14, firstDueDate: "2026-06-01",
      nextDueDate: "2026-06-15", status: "ACTIVE", matchRuleId: null, notes: "old",
    });

    await setInstallmentNotes(db, id, null);
    expect((await repo.getById(id))?.notes).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// buildInstallmentFromTransaction
// ---------------------------------------------------------------------------

test("Path A: 14-day cadence, derived total, ACTIVE when partly paid", () => {
  const p = buildInstallmentFromTransaction({ txDate: "2026-06-01", merchant: "Afterpay – ACME", installmentCents: 2500, totalInstallments: 4, installmentsPaid: 1 });
  expect(p.frequencyDays).toBe(14);
  expect(p.firstDueDate).toBe("2026-06-01");
  expect(p.nextDueDate).toBe("2026-06-15");          // +1×14
  expect(p.totalCents).toBe(10000);                   // 2500×4
  expect(p.installmentsPaid).toBe(1);
  expect(p.status).toBe("ACTIVE");
});

test("Path A: COMPLETE when installmentsPaid >= totalInstallments", () => {
  const p = buildInstallmentFromTransaction({ txDate: "2026-06-01", merchant: "X", installmentCents: 2500, totalInstallments: 4, installmentsPaid: 4 });
  expect(p.status).toBe("COMPLETE");
});

// ---------------------------------------------------------------------------
// createInstallmentFromTransaction (Path A — DB-writing core)
// ---------------------------------------------------------------------------

/** Seed an account + transaction to satisfy FK constraints. */
function seedTransaction(txDb: DbClient, txId: string): void {
  txDb.insert(tables.accounts).values({
    id: "acc-test",
    name: "Spending",
    type: "TRANSACTIONAL",
    ownership: "INDIVIDUAL",
    balanceCents: 0,
    role: "SPENDING",
    monthlyAllocationCents: 0,
    lastSyncedAt: null,
    updatedAt: new Date().toISOString(),
  }).run();
  txDb.insert(tables.transactions).values({
    id: txId,
    accountId: "acc-test",
    status: "SETTLED",
    description: "Afterpay – ACME",
    amountCents: -10000,
    createdAt: "2026-06-01",
  }).run();
}

const baseInput = {
  transactionId: "tx-bnpl-1",
  txDate: "2026-06-01",
  merchant: "Afterpay – ACME",
  installmentCents: 2500,
  totalInstallments: 4,
  installmentsPaid: 1,
};

describe("createInstallmentFromTransaction", () => {
  it("creates a plan and links the originating transaction on first call", async () => {
    seedTransaction(db, "tx-bnpl-1");
    const result = await createInstallmentFromTransaction(db, baseInput);
    expect(result.ok).toBe(true);
    expect(typeof (result as { ok: true; planId: string }).planId).toBe("string");

    const plans = await new DrizzleInstallmentRepo(db).list();
    expect(plans).toHaveLength(1);
  });

  it("rejects re-marking a transaction that is already linked to a BNPL plan", async () => {
    seedTransaction(db, "tx-bnpl-1");

    // first mark succeeds
    const first = await createInstallmentFromTransaction(db, baseInput);
    expect(first.ok).toBe(true);

    // re-mark the SAME transaction — must be rejected, no 2nd plan created
    const second = await createInstallmentFromTransaction(db, baseInput);
    expect(second.ok).toBe(false);
    expect((second as { ok: false; error: string }).error).toMatch(/already linked|already a BNPL|already tracked/i);

    const plans = await new DrizzleInstallmentRepo(db).list();
    expect(plans).toHaveLength(1);
  });
});
