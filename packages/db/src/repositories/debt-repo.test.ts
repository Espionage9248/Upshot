import { afterEach, describe, it, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDbClient, type DbClient } from "../client";
import { applyMigrations } from "../migrate";
import { DrizzleDebtRepo } from "./debt-repo";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function freshDb(): DbClient {
  const dir = mkdtempSync(join(tmpdir(), "upshot-debtrepo-"));
  dirs.push(dir);
  const { db } = createDbClient({ url: join(dir, "x.db"), key: KEY });
  applyMigrations(db as DbClient);
  return db as DbClient;
}

afterEach(() => { while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true }); });

describe("DrizzleDebtRepo", () => {
  it("CRUD round-trip: create, getById, list, update, delete", async () => {
    const repo = new DrizzleDebtRepo(freshDb());

    const id = await repo.create({
      id: "debt-1",
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
      payoffPriority: 1,
      includeInSnowball: true,
      includeInNetWorth: true,
      matchRuleId: null,
      accountNumber: null,
      institutionName: "ANZ",
      notes: null,
    });
    expect(id).toBe("debt-1");

    const got = await repo.getById(id);
    expect(got).not.toBeNull();
    expect(got?.name).toBe("Visa Card");
    expect(got?.currentBalanceCents).toBe(100000);
    expect(got?.interestRate).toBe(0.1995);
    expect(got?.estimatedPayoffDate).toBeNull();
    expect(got?.monthsRemaining).toBeNull();
    expect(got?.totalInterestProjectedCents).toBeNull();
    expect(got?.lastFeeAppliedAt).toBeNull();

    // getById unknown
    expect(await repo.getById("no-such")).toBeNull();

    // list
    const list = await repo.list();
    expect(list.map((d) => d.id)).toContain(id);

    // update
    await repo.update({ ...got!, name: "Visa Updated", currentBalanceCents: 90000 });
    const updated = await repo.getById(id);
    expect(updated?.name).toBe("Visa Updated");
    expect(updated?.currentBalanceCents).toBe(90000);

    // delete
    await repo.delete(id);
    expect(await repo.getById(id)).toBeNull();
  });

  it("recordPayment appends and listPayments returns it", async () => {
    const repo = new DrizzleDebtRepo(freshDb());
    const id = await repo.create({
      id: "debt-2",
      name: "Car Loan",
      type: "PERSONAL_LOAN",
      currentBalanceCents: 500000,
      originalBalanceCents: 600000,
      creditLimitCents: null,
      monthlyPaymentCents: 30000,
      minimumPaymentCents: 30000,
      interestRate: 0.0799,
      monthlyFeeCents: null,
      feeDueDay: null,
      payoffPriority: 2,
      includeInSnowball: true,
      includeInNetWorth: true,
      matchRuleId: null,
      accountNumber: null,
      institutionName: "CBA",
      notes: null,
    });

    await repo.recordPayment({
      debtId: id,
      amountCents: 30000,
      principalCents: 27000,
      interestCents: 3000,
      paymentDate: "2026-06-01",
      transactionId: null,
      notes: "June payment",
    });

    const payments = await repo.listPayments(id);
    expect(payments).toHaveLength(1);
    expect(payments[0]?.amountCents).toBe(30000);
    expect(payments[0]?.principalCents).toBe(27000);
    expect(payments[0]?.interestCents).toBe(3000);
    expect(payments[0]?.paymentDate).toBe("2026-06-01");
    expect(payments[0]?.notes).toBe("June payment");
    expect(payments[0]?.debtId).toBe(id);
    expect(typeof payments[0]?.id).toBe("string");
  });

  it("listPayments returns empty for debt with no payments", async () => {
    const repo = new DrizzleDebtRepo(freshDb());
    const id = await repo.create({
      id: "debt-3",
      name: "HECS Debt",
      type: "PERSONAL_LOAN",
      currentBalanceCents: 2000000,
      originalBalanceCents: null,
      creditLimitCents: null,
      monthlyPaymentCents: 0,
      minimumPaymentCents: null,
      interestRate: null,
      monthlyFeeCents: null,
      feeDueDay: null,
      payoffPriority: 999,
      includeInSnowball: false,
      includeInNetWorth: true,
      matchRuleId: null,
      accountNumber: null,
      institutionName: null,
      notes: null,
    });
    expect(await repo.listPayments(id)).toHaveLength(0);
  });

  it("applyFee updates currentBalanceCents and lastFeeAppliedAt", async () => {
    const repo = new DrizzleDebtRepo(freshDb());
    const id = await repo.create({
      id: "debt-4",
      name: "Personal Loan",
      type: "PERSONAL_LOAN",
      currentBalanceCents: 100000,
      originalBalanceCents: null,
      creditLimitCents: null,
      monthlyPaymentCents: 10000,
      minimumPaymentCents: null,
      interestRate: 0.12,
      monthlyFeeCents: 1500,
      feeDueDay: 15,
      payoffPriority: 3,
      includeInSnowball: true,
      includeInNetWorth: true,
      matchRuleId: null,
      accountNumber: null,
      institutionName: null,
      notes: null,
    });

    await repo.applyFee(id, 101500, "2026-06-15T00:00:00.000Z");
    const got = await repo.getById(id);
    expect(got?.currentBalanceCents).toBe(101500);
    expect(got?.lastFeeAppliedAt).toBe("2026-06-15T00:00:00.000Z");
  });

  it("updateProjections stores projection fields", async () => {
    const repo = new DrizzleDebtRepo(freshDb());
    const id = await repo.create({
      id: "debt-5",
      name: "Mortgage",
      type: "MORTGAGE",
      currentBalanceCents: 50000000,
      originalBalanceCents: 60000000,
      creditLimitCents: null,
      monthlyPaymentCents: 200000,
      minimumPaymentCents: 200000,
      interestRate: 0.059,
      monthlyFeeCents: null,
      feeDueDay: null,
      payoffPriority: 5,
      includeInSnowball: true,
      includeInNetWorth: true,
      matchRuleId: null,
      accountNumber: null,
      institutionName: "Westpac",
      notes: null,
    });

    await repo.updateProjections(id, {
      estimatedPayoffDate: "2056-06-01",
      monthsRemaining: 360,
      totalInterestProjectedCents: 20000000,
    });

    const got = await repo.getById(id);
    expect(got?.estimatedPayoffDate).toBe("2056-06-01");
    expect(got?.monthsRemaining).toBe(360);
    expect(got?.totalInterestProjectedCents).toBe(20000000);
  });

  // ── New methods: listWithRule, listLinkedPaymentTxIds, applyPaymentMatches ──

  it("listWithRule: returns full conditions, [] when no rule", async () => {
    const db = freshDb();
    const repo = new DrizzleDebtRepo(db);
    const { matchRules, matchConditions } = await import("../schema");

    // Seed a match rule with one description condition
    db.insert(matchRules).values({ id: "r1", name: "Zip rule", isActive: true, priority: 1 }).run();
    db.insert(matchConditions).values({
      id: "c1",
      ruleId: "r1",
      field: "description",
      mode: "contains",
      value: "zip",
    }).run();

    // Debt with a rule
    const idWithRule = await repo.create({
      id: "debt-rule",
      name: "Zip Pay",
      type: "BNPL",
      currentBalanceCents: 20000,
      originalBalanceCents: null,
      creditLimitCents: null,
      monthlyPaymentCents: 0,
      minimumPaymentCents: null,
      interestRate: null,
      monthlyFeeCents: null,
      feeDueDay: null,
      payoffPriority: 1,
      includeInSnowball: false,
      includeInNetWorth: true,
      matchRuleId: "r1",
      accountNumber: null,
      institutionName: null,
      notes: null,
    });

    // Debt without a rule
    const idNoRule = await repo.create({
      id: "debt-norule",
      name: "Car Loan",
      type: "PERSONAL_LOAN",
      currentBalanceCents: 300000,
      originalBalanceCents: null,
      creditLimitCents: null,
      monthlyPaymentCents: 10000,
      minimumPaymentCents: null,
      interestRate: null,
      monthlyFeeCents: null,
      feeDueDay: null,
      payoffPriority: 2,
      includeInSnowball: true,
      includeInNetWorth: true,
      matchRuleId: null,
      accountNumber: null,
      institutionName: null,
      notes: null,
    });

    const results = await repo.listWithRule();
    const withRule = results.find((r) => r.debt.id === idWithRule);
    const noRule = results.find((r) => r.debt.id === idNoRule);

    expect(withRule).not.toBeUndefined();
    expect(withRule?.conditions).toHaveLength(1);
    expect(withRule?.conditions[0]).toMatchObject({ id: "c1", ruleId: "r1", field: "description", mode: "contains", value: "zip" });
    expect(noRule).not.toBeUndefined();
    expect(noRule?.conditions).toEqual([]);
  });

  it("applyPaymentMatches inserts debt_payments and updates balance; listLinkedPaymentTxIds contains the tx", async () => {
    const db = freshDb();
    const repo = new DrizzleDebtRepo(db);

    // Seed account + transaction to satisfy FK on debtPayments.transactionId
    const { accounts, transactions } = await import("../schema");
    db.insert(accounts).values({
      id: "acc-1",
      name: "Spending",
      type: "TRANSACTIONAL",
      ownership: "INDIVIDUAL",
      balanceCents: 100000,
      role: "SPENDING",
    }).run();
    db.insert(transactions).values({
      id: "t1",
      accountId: "acc-1",
      status: "SETTLED",
      description: "Zip Pay",
      amountCents: -3000,
      createdAt: "2026-06-15T00:00:00.000Z",
    }).run();
    const debtId = await repo.create({
      id: "debt-match",
      name: "Afterpay",
      type: "BNPL",
      currentBalanceCents: 20000,
      originalBalanceCents: null,
      creditLimitCents: null,
      monthlyPaymentCents: 0,
      minimumPaymentCents: null,
      interestRate: null,
      monthlyFeeCents: null,
      feeDueDay: null,
      payoffPriority: 1,
      includeInSnowball: false,
      includeInNetWorth: true,
      matchRuleId: null,
      accountNumber: null,
      institutionName: null,
      notes: null,
    });

    // Before: no linked tx ids
    const before = await repo.listLinkedPaymentTxIds();
    expect(before.has("t1")).toBe(false);

    await repo.applyPaymentMatches(
      [{ debtId, transactionId: "t1", amountCents: 3000, paidAt: "2026-06-15" }],
      [{ debtId, newBalanceCents: 17000 }],
    );

    // Payment row inserted
    const payments = await repo.listPayments(debtId);
    expect(payments).toHaveLength(1);
    expect(payments[0]?.amountCents).toBe(3000);
    expect(payments[0]?.paymentDate).toBe("2026-06-15");
    expect(payments[0]?.transactionId).toBe("t1");

    // Balance updated
    const debt = await repo.getById(debtId);
    expect(debt?.currentBalanceCents).toBe(17000);

    // listLinkedPaymentTxIds includes "t1"
    const after = await repo.listLinkedPaymentTxIds();
    expect(after.has("t1")).toBe(true);
  });

  it("setMatchRule sets and clears matchRuleId; clearMatchRuleByRule nulls all entities pointing at a rule", async () => {
    const db = freshDb();
    // Seed a matchRules row to satisfy the FK constraint.
    const { matchRules } = await import("../schema");
    db.insert(matchRules).values({ id: "rule-x", name: "Test Rule", isActive: true, priority: 0 }).run();
    const repo = new DrizzleDebtRepo(db);

    const id = await repo.create({
      id: "debt-link",
      name: "Zip Pay",
      type: "BNPL",
      currentBalanceCents: 10000,
      originalBalanceCents: null,
      creditLimitCents: null,
      monthlyPaymentCents: 0,
      minimumPaymentCents: null,
      interestRate: null,
      monthlyFeeCents: null,
      feeDueDay: null,
      payoffPriority: 1,
      includeInSnowball: false,
      includeInNetWorth: true,
      matchRuleId: null,
      accountNumber: null,
      institutionName: null,
      notes: null,
    });

    // setMatchRule links to "rule-x"
    await repo.setMatchRule(id, "rule-x");
    expect((await repo.getById(id))?.matchRuleId).toBe("rule-x");

    // setMatchRule with null clears it
    await repo.setMatchRule(id, null);
    expect((await repo.getById(id))?.matchRuleId).toBeNull();

    // clearMatchRuleByRule: re-link then bulk-clear
    await repo.setMatchRule(id, "rule-x");
    expect((await repo.getById(id))?.matchRuleId).toBe("rule-x");
    await repo.clearMatchRuleByRule("rule-x");
    expect((await repo.getById(id))?.matchRuleId).toBeNull();
  });

  it("delete cascades to debt_payments", async () => {
    const repo = new DrizzleDebtRepo(freshDb());
    const id = await repo.create({
      id: "debt-6",
      name: "Credit Card",
      type: "CREDIT_CARD",
      currentBalanceCents: 50000,
      originalBalanceCents: null,
      creditLimitCents: 200000,
      monthlyPaymentCents: 5000,
      minimumPaymentCents: 2500,
      interestRate: 0.2199,
      monthlyFeeCents: null,
      feeDueDay: null,
      payoffPriority: 1,
      includeInSnowball: true,
      includeInNetWorth: true,
      matchRuleId: null,
      accountNumber: null,
      institutionName: null,
      notes: null,
    });

    await repo.recordPayment({ debtId: id, amountCents: 5000, paymentDate: "2026-05-01" });
    await repo.recordPayment({ debtId: id, amountCents: 5000, paymentDate: "2026-06-01" });
    expect(await repo.listPayments(id)).toHaveLength(2);

    await repo.delete(id);
    expect(await repo.getById(id)).toBeNull();
    // cascade: listPayments of deleted debt returns empty
    expect(await repo.listPayments(id)).toHaveLength(0);
  });

  it("setPaymentsLinkedAt stamps and clears the column", async () => {
    const db = freshDb();
    const repo = new DrizzleDebtRepo(db);
    const id = await repo.create({
      id: "debt-linked-at", name: "Zip", type: "BNPL", currentBalanceCents: 10000, originalBalanceCents: null,
      creditLimitCents: null, monthlyPaymentCents: 0, minimumPaymentCents: null, interestRate: null,
      monthlyFeeCents: null, feeDueDay: null, payoffPriority: 999, includeInSnowball: true,
      includeInNetWorth: true, matchRuleId: null, accountNumber: null, institutionName: null, notes: null,
    });
    await repo.setPaymentsLinkedAt(id, "2026-06-25");
    expect((await repo.getById(id))?.paymentsLinkedAt).toBe("2026-06-25");
    await repo.setPaymentsLinkedAt(id, null);
    expect((await repo.getById(id))?.paymentsLinkedAt).toBeNull();
  });

  describe("latestPaymentCentsByDebt", () => {
    it("returns the latest payment per debt (max paymentDate) and omits debts with no payments", async () => {
      const db = freshDb();
      const repo = new DrizzleDebtRepo(db);

      await repo.create({
        id: "d1", name: "Zip", type: "BNPL", currentBalanceCents: 50000,
        originalBalanceCents: null, creditLimitCents: null, monthlyPaymentCents: 8000,
        minimumPaymentCents: 4000, interestRate: null, monthlyFeeCents: null, feeDueDay: null,
        payoffPriority: 1, includeInSnowball: true, includeInNetWorth: true, matchRuleId: null,
        accountNumber: null, institutionName: null, notes: null,
      });
      await repo.create({
        id: "d2", name: "No-pay", type: "CREDIT_CARD", currentBalanceCents: 100000,
        originalBalanceCents: null, creditLimitCents: null, monthlyPaymentCents: 6000,
        minimumPaymentCents: 6000, interestRate: null, monthlyFeeCents: null, feeDueDay: null,
        payoffPriority: 2, includeInSnowball: true, includeInNetWorth: true, matchRuleId: null,
        accountNumber: null, institutionName: null, notes: null,
      });

      // Two payments on d1; the later date (2026-05-10) wins even though inserted first.
      await repo.recordPayment({ debtId: "d1", amountCents: 7300, paymentDate: "2026-05-10" });
      await repo.recordPayment({ debtId: "d1", amountCents: 6900, paymentDate: "2026-04-10" });

      const map = await repo.latestPaymentCentsByDebt();
      expect(map.get("d1")).toEqual({ amountCents: 7300, paidAt: "2026-05-10" });
      expect(map.has("d2")).toBe(false);
    });
  });
});
