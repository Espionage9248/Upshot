import { describe, it, expect } from "vitest";
import { InMemoryDebtRepo } from "./in-memory-debt-repo";
import type { Debt } from "@upshot/contracts";

let _counter = 0;
function makeDebt(overrides: Partial<Debt> = {}): Debt {
  return {
    id: `d${++_counter}`,
    name: "Visa Card",
    type: "CREDIT_CARD",
    currentBalanceCents: 100000,
    originalBalanceCents: null,
    creditLimitCents: 500000,
    monthlyPaymentCents: 20000,
    minimumPaymentCents: 5000,
    interestRate: 0.1995,
    monthlyFeeCents: null,
    feeDueDay: null,
    lastFeeAppliedAt: null,
    payoffPriority: 1,
    includeInSnowball: true,
    includeInNetWorth: true,
    matchRuleId: null,
    paymentsLinkedAt: null,
    accountNumber: null,
    institutionName: "ANZ",
    notes: null,
    estimatedPayoffDate: null,
    monthsRemaining: null,
    totalInterestProjectedCents: null,
    ...overrides,
  };
}

describe("InMemoryDebtRepo", () => {
  it("create returns an id and getById round-trips", async () => {
    const repo = new InMemoryDebtRepo();
    const debt = makeDebt();
    const id = await repo.create(debt);
    expect(typeof id).toBe("string");
    const got = await repo.getById(id);
    expect(got).not.toBeNull();
    expect(got?.name).toBe("Visa Card");
    expect(got?.currentBalanceCents).toBe(100000);
  });

  it("list returns all debts", async () => {
    const repo = new InMemoryDebtRepo();
    await repo.create(makeDebt({ name: "Visa" }));
    await repo.create(makeDebt({ name: "Mastercard" }));
    const list = await repo.list();
    expect(list).toHaveLength(2);
    expect(list.map((d) => d.name).sort()).toEqual(["Mastercard", "Visa"]);
  });

  it("update mutates the stored debt", async () => {
    const repo = new InMemoryDebtRepo();
    const id = await repo.create(makeDebt());
    const got = await repo.getById(id);
    await repo.update({ ...got!, name: "Updated Visa", currentBalanceCents: 90000 });
    const updated = await repo.getById(id);
    expect(updated?.name).toBe("Updated Visa");
    expect(updated?.currentBalanceCents).toBe(90000);
  });

  it("delete removes the debt and getById returns null", async () => {
    const repo = new InMemoryDebtRepo();
    const id = await repo.create(makeDebt());
    await repo.delete(id);
    expect(await repo.getById(id)).toBeNull();
  });

  it("getById returns null for unknown id", async () => {
    const repo = new InMemoryDebtRepo();
    expect(await repo.getById("no-such")).toBeNull();
  });

  it("recordPayment appends and listPayments returns it", async () => {
    const repo = new InMemoryDebtRepo();
    const id = await repo.create(makeDebt());
    await repo.recordPayment({
      debtId: id,
      amountCents: 20000,
      principalCents: 18000,
      interestCents: 2000,
      paymentDate: "2026-06-01",
      transactionId: "txn1",
      notes: null,
    });
    const payments = await repo.listPayments(id);
    expect(payments).toHaveLength(1);
    expect(payments[0]?.amountCents).toBe(20000);
    expect(payments[0]?.principalCents).toBe(18000);
    expect(payments[0]?.debtId).toBe(id);
  });

  it("listPayments returns empty array for debt with no payments", async () => {
    const repo = new InMemoryDebtRepo();
    const id = await repo.create(makeDebt());
    expect(await repo.listPayments(id)).toHaveLength(0);
  });

  it("applyFee mutates currentBalanceCents and lastFeeAppliedAt", async () => {
    const repo = new InMemoryDebtRepo();
    const id = await repo.create(makeDebt({ currentBalanceCents: 100000 }));
    await repo.applyFee(id, 101500, "2026-06-15T00:00:00.000Z");
    const got = await repo.getById(id);
    expect(got?.currentBalanceCents).toBe(101500);
    expect(got?.lastFeeAppliedAt).toBe("2026-06-15T00:00:00.000Z");
  });

  it("updateProjections stores estimatedPayoffDate, monthsRemaining, totalInterestProjectedCents", async () => {
    const repo = new InMemoryDebtRepo();
    const id = await repo.create(makeDebt());
    await repo.updateProjections(id, {
      estimatedPayoffDate: "2028-06-01",
      monthsRemaining: 24,
      totalInterestProjectedCents: 15000,
    });
    const got = await repo.getById(id);
    expect(got?.estimatedPayoffDate).toBe("2028-06-01");
    expect(got?.monthsRemaining).toBe(24);
    expect(got?.totalInterestProjectedCents).toBe(15000);
  });

  it("delete also removes payments", async () => {
    const repo = new InMemoryDebtRepo();
    const id = await repo.create(makeDebt());
    await repo.recordPayment({ debtId: id, amountCents: 5000, paymentDate: "2026-06-01" });
    await repo.delete(id);
    expect(await repo.listPayments(id)).toHaveLength(0);
  });
});
