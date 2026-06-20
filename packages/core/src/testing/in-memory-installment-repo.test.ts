import { describe, it, expect } from "vitest";
import { InMemoryInstallmentRepo } from "./in-memory-installment-repo";
import type { InstallmentPlan } from "@upshot/contracts";

let _counter = 0;
function makePlan(overrides: Partial<InstallmentPlan> = {}): InstallmentPlan {
  const n = ++_counter;
  return {
    id: `plan-${n}`,
    merchant: "Afterpay",
    totalCents: 40000,
    installmentCents: 10000,
    totalInstallments: 4,
    installmentsPaid: 0,
    frequencyDays: 14,
    firstDueDate: "2026-01-01",
    nextDueDate: "2026-01-01",
    status: "ACTIVE",
    matchRuleId: null,
    notes: null,
    ...overrides,
  };
}

describe("InMemoryInstallmentRepo", () => {
  it("create returns an id and getById round-trips", async () => {
    const repo = new InMemoryInstallmentRepo();
    const plan = makePlan();
    const id = await repo.create(plan);
    expect(typeof id).toBe("string");
    const got = await repo.getById(id);
    expect(got).not.toBeNull();
    expect(got?.merchant).toBe("Afterpay");
    expect(got?.totalCents).toBe(40000);
  });

  it("list returns all plans", async () => {
    const repo = new InMemoryInstallmentRepo();
    await repo.create(makePlan({ merchant: "Afterpay" }));
    await repo.create(makePlan({ merchant: "Zip" }));
    const list = await repo.list();
    expect(list).toHaveLength(2);
    expect(list.map((p) => p.merchant).sort()).toEqual(["Afterpay", "Zip"]);
  });

  it("getById returns null for unknown id", async () => {
    const repo = new InMemoryInstallmentRepo();
    expect(await repo.getById("no-such")).toBeNull();
  });

  it("delete removes the plan and getById returns null", async () => {
    const repo = new InMemoryInstallmentRepo();
    const id = await repo.create(makePlan());
    await repo.delete(id);
    expect(await repo.getById(id)).toBeNull();
  });

  it("applyMatches updates plan fields and inserts payment rows", async () => {
    const repo = new InMemoryInstallmentRepo();
    const id = await repo.create(makePlan());

    await repo.applyMatches(
      [{ planId: id, installmentsPaid: 1, nextDueDate: "2026-01-15", status: "ACTIVE" }],
      [{ planId: id, transactionId: "txn-1", dueIndex: 0, paidAt: "2026-01-01T00:00:00.000Z" }],
    );

    const got = await repo.getById(id);
    expect(got?.installmentsPaid).toBe(1);
    expect(got?.nextDueDate).toBe("2026-01-15");
    expect(got?.status).toBe("ACTIVE");

    const linked = await repo.listLinkedTransactionIds();
    expect(linked.has("txn-1")).toBe(true);
  });

  it("applyMatches only updates plans present in updates (zero-match plans untouched)", async () => {
    const repo = new InMemoryInstallmentRepo();
    const id1 = await repo.create(makePlan({ id: "p1" }));
    const id2 = await repo.create(makePlan({ id: "p2" }));

    // Only update plan 1
    await repo.applyMatches(
      [{ planId: id1, installmentsPaid: 2, nextDueDate: "2026-02-01", status: "ACTIVE" }],
      [{ planId: id1, transactionId: "txn-a", dueIndex: 1, paidAt: "2026-01-15T00:00:00.000Z" }],
    );

    const got1 = await repo.getById(id1);
    expect(got1?.installmentsPaid).toBe(2);

    const got2 = await repo.getById(id2);
    expect(got2?.installmentsPaid).toBe(0); // untouched
  });

  it("listLinkedTransactionIds returns all linked tx ids", async () => {
    const repo = new InMemoryInstallmentRepo();
    const id = await repo.create(makePlan());

    await repo.applyMatches(
      [{ planId: id, installmentsPaid: 2, nextDueDate: "2026-02-01", status: "ACTIVE" }],
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
    const repo = new InMemoryInstallmentRepo();
    const linked = await repo.listLinkedTransactionIds();
    expect(linked.size).toBe(0);
  });

  it("delete also removes associated payments", async () => {
    const repo = new InMemoryInstallmentRepo();
    const id = await repo.create(makePlan());

    await repo.applyMatches(
      [{ planId: id, installmentsPaid: 1, nextDueDate: "2026-01-15", status: "ACTIVE" }],
      [{ planId: id, transactionId: "txn-x", dueIndex: 0, paidAt: "2026-01-01T00:00:00.000Z" }],
    );

    await repo.delete(id);
    expect(await repo.getById(id)).toBeNull();
    const linked = await repo.listLinkedTransactionIds();
    expect(linked.has("txn-x")).toBe(false);
  });
});
