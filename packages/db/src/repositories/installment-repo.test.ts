import { afterEach, describe, it, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDbClient, type DbClient } from "../client";
import { applyMigrations } from "../migrate";
import { DrizzleInstallmentRepo } from "./installment-repo";
import { accounts, transactions } from "../schema";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function freshDb(): DbClient {
  const dir = mkdtempSync(join(tmpdir(), "upshot-installrepo-"));
  dirs.push(dir);
  const { db } = createDbClient({ url: join(dir, "x.db"), key: KEY });
  applyMigrations(db as DbClient);
  return db as DbClient;
}

afterEach(() => { while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true }); });

/** Seed an account + one or more transactions to satisfy FK constraints for installment_plan_payments. */
function seedTransactions(db: DbClient, txnIds: string[]): void {
  db.insert(accounts).values({
    id: "acc-seed",
    name: "Spending",
    type: "TRANSACTIONAL",
    ownership: "INDIVIDUAL",
    balanceCents: 0,
    role: "SPENDING",
    monthlyAllocationCents: 0,
    lastSyncedAt: null,
    updatedAt: new Date().toISOString(),
  }).run();

  for (const id of txnIds) {
    db.insert(transactions).values({
      id,
      accountId: "acc-seed",
      status: "SETTLED",
      description: "Test txn",
      amountCents: -1000,
      createdAt: new Date().toISOString(),
    }).run();
  }
}

describe("DrizzleInstallmentRepo", () => {
  it("CRUD round-trip: create, getById, list, delete", async () => {
    const repo = new DrizzleInstallmentRepo(freshDb());

    const id = await repo.create({
      id: "plan-1",
      merchant: "Afterpay",
      totalCents: 40000,
      installmentCents: 10000,
      totalInstallments: 4,
      frequencyDays: 14,
      firstDueDate: "2026-01-01",
      matchRuleId: null,
      notes: null,
    });
    expect(id).toBe("plan-1");

    const got = await repo.getById(id);
    expect(got).not.toBeNull();
    expect(got?.merchant).toBe("Afterpay");
    expect(got?.totalCents).toBe(40000);
    expect(got?.installmentsPaid).toBe(0);
    expect(got?.status).toBe("ACTIVE");
    expect(got?.nextDueDate).toBe("2026-01-01");

    // getById unknown
    expect(await repo.getById("no-such")).toBeNull();

    // list
    const list = await repo.list();
    expect(list.map((p) => p.id)).toContain(id);

    // delete
    await repo.delete(id);
    expect(await repo.getById(id)).toBeNull();
  });

  it("applyMatches updates plan fields and inserts payment rows", async () => {
    const db = freshDb();
    seedTransactions(db, ["txn-1"]);
    const repo = new DrizzleInstallmentRepo(db);

    const id = await repo.create({
      id: "plan-2",
      merchant: "Zip",
      totalCents: 20000,
      installmentCents: 5000,
      totalInstallments: 4,
      frequencyDays: 14,
      firstDueDate: "2026-02-01",
      matchRuleId: null,
      notes: null,
    });

    await repo.applyMatches(
      [{ planId: id, installmentsPaid: 1, nextDueDate: "2026-02-15", status: "ACTIVE" }],
      [{ planId: id, transactionId: "txn-1", dueIndex: 0, paidAt: "2026-02-01T00:00:00.000Z" }],
    );

    const got = await repo.getById(id);
    expect(got?.installmentsPaid).toBe(1);
    expect(got?.nextDueDate).toBe("2026-02-15");
    expect(got?.status).toBe("ACTIVE");

    const linked = await repo.listLinkedTransactionIds();
    expect(linked.has("txn-1")).toBe(true);
  });

  it("applyMatches only updates plans in updates (zero-match plans untouched)", async () => {
    const db = freshDb();
    seedTransactions(db, ["txn-a"]);
    const repo = new DrizzleInstallmentRepo(db);

    const id1 = await repo.create({
      id: "plan-3a",
      merchant: "Afterpay",
      totalCents: 40000,
      installmentCents: 10000,
      totalInstallments: 4,
      frequencyDays: 14,
      firstDueDate: "2026-01-01",
      matchRuleId: null,
      notes: null,
    });
    const id2 = await repo.create({
      id: "plan-3b",
      merchant: "Zip",
      totalCents: 20000,
      installmentCents: 5000,
      totalInstallments: 4,
      frequencyDays: 14,
      firstDueDate: "2026-01-01",
      matchRuleId: null,
      notes: null,
    });

    await repo.applyMatches(
      [{ planId: id1, installmentsPaid: 2, nextDueDate: "2026-01-29", status: "ACTIVE" }],
      [{ planId: id1, transactionId: "txn-a", dueIndex: 1, paidAt: "2026-01-15T00:00:00.000Z" }],
    );

    const got1 = await repo.getById(id1);
    expect(got1?.installmentsPaid).toBe(2);

    const got2 = await repo.getById(id2);
    expect(got2?.installmentsPaid).toBe(0); // untouched
  });

  it("listLinkedTransactionIds returns all linked tx ids", async () => {
    const db = freshDb();
    seedTransactions(db, ["txn-1", "txn-2"]);
    const repo = new DrizzleInstallmentRepo(db);

    const id = await repo.create({
      id: "plan-4",
      merchant: "Afterpay",
      totalCents: 40000,
      installmentCents: 10000,
      totalInstallments: 4,
      frequencyDays: 14,
      firstDueDate: "2026-01-01",
      matchRuleId: null,
      notes: null,
    });

    await repo.applyMatches(
      [{ planId: id, installmentsPaid: 2, nextDueDate: "2026-01-29", status: "ACTIVE" }],
      [
        { planId: id, transactionId: "txn-1", dueIndex: 0, paidAt: "2026-01-01T00:00:00.000Z" },
        { planId: id, transactionId: "txn-2", dueIndex: 1, paidAt: "2026-01-15T00:00:00.000Z" },
      ],
    );

    const linked = await repo.listLinkedTransactionIds();
    expect(linked.size).toBe(2);
    expect(linked.has("txn-1")).toBe(true);
    expect(linked.has("txn-2")).toBe(true);
  });

  it("listLinkedTransactionIds returns empty set with no payments", async () => {
    const repo = new DrizzleInstallmentRepo(freshDb());
    const linked = await repo.listLinkedTransactionIds();
    expect(linked.size).toBe(0);
  });

  it("delete cascades to installment_plan_payments", async () => {
    const db = freshDb();
    seedTransactions(db, ["txn-x"]);
    const repo = new DrizzleInstallmentRepo(db);

    const id = await repo.create({
      id: "plan-5",
      merchant: "Afterpay",
      totalCents: 40000,
      installmentCents: 10000,
      totalInstallments: 4,
      frequencyDays: 14,
      firstDueDate: "2026-01-01",
      matchRuleId: null,
      notes: null,
    });

    await repo.applyMatches(
      [{ planId: id, installmentsPaid: 1, nextDueDate: "2026-01-15", status: "ACTIVE" }],
      [{ planId: id, transactionId: "txn-x", dueIndex: 0, paidAt: "2026-01-01T00:00:00.000Z" }],
    );

    expect((await repo.listLinkedTransactionIds()).has("txn-x")).toBe(true);

    await repo.delete(id);
    expect(await repo.getById(id)).toBeNull();
    // cascade: linked transaction ids no longer present
    expect((await repo.listLinkedTransactionIds()).has("txn-x")).toBe(false);
  });
});
