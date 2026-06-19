// packages/core/src/sync/sync-service.test.ts
import { describe, it, expect } from "vitest";
import { SyncService, INCREMENTAL_OVERLAP_MS } from "./sync-service";
import { InMemoryAccountRepo } from "../testing/in-memory-account-repo";
import { InMemoryTransactionRepo } from "../testing/in-memory-transaction-repo";
import { InMemoryCategoryRepo } from "../testing/in-memory-category-repo";
import { InMemoryJobRunRepo } from "../testing/in-memory-job-run-repo";
import { InMemoryMatchRuleRepo } from "../testing/in-memory-match-rule-repo";
import {
  UpAuthError,
  type UpClientPort, type UpAccountResource, type UpTransactionResource, type UpCategoryResource,
} from "../up/types";

function fakeUp(over: Partial<UpClientPort> = {}): UpClientPort & { sinceSeen: string[] } {
  const sinceSeen: string[] = [];
  return {
    sinceSeen,
    ping: async () => {},
    listCategories: async () => [] as UpCategoryResource[],
    listAccounts: async () => [] as UpAccountResource[],
    listTransactions: async (opts) => { if (opts?.since) sinceSeen.push(opts.since); return [] as UpTransactionResource[]; },
    addTag: async () => {},
    setCategory: async () => {},
    ...over,
  };
}

function makeDeps(up: UpClientPort, over: Record<string, unknown> = {}) {
  let n = 0;
  return {
    up,
    accounts: new InMemoryAccountRepo(),
    transactions: new InMemoryTransactionRepo(),
    categories: new InMemoryCategoryRepo(),
    matchRules: new InMemoryMatchRuleRepo([]),
    jobRuns: new InMemoryJobRunRepo(),
    newId: () => `job-${++n}`,
    now: () => new Date("2026-06-13T10:00:00.000Z"),
    ...over,
  };
}

const acc: UpAccountResource = {
  type: "accounts", id: "a1",
  attributes: { displayName: "Spending", accountType: "TRANSACTIONAL", ownershipType: "INDIVIDUAL", balance: { currencyCode: "AUD", value: "10.00", valueInBaseUnits: 1000 }, createdAt: "2026-01-01T00:00:00Z" },
};
function upTxn(id: string): UpTransactionResource {
  return {
    type: "transactions", id,
    attributes: { status: "SETTLED", description: "Coffee", message: null, rawText: null, amount: { currencyCode: "AUD", value: "-5.00", valueInBaseUnits: -500 }, foreignAmount: null, cardPurchaseMethod: null, roundUp: null, cashback: null, note: null, settledAt: null, createdAt: "2026-06-12T00:00:00Z" },
    relationships: { account: { data: { type: "accounts", id: "a1" } }, transferAccount: { data: null }, category: { data: null }, parentCategory: { data: null }, tags: { data: [] }, attachment: { data: null } },
  };
}

describe("SyncService.sync — full", () => {
  it("syncs categories, accounts, and transactions and records a SUCCESS job_run with counts + cursor", async () => {
    const up = fakeUp({
      listCategories: async () => [{ type: "categories", id: "c1", attributes: { name: "Cafés" }, relationships: { parent: { data: null } } }],
      listAccounts: async () => [acc],
      listTransactions: async () => [upTxn("t1"), upTxn("t2")],
    });
    const d = makeDeps(up);
    const svc = new SyncService(d);
    const result = await svc.sync({ mode: "full" });

    expect(result.status).toBe("SUCCESS");
    expect(result.counts).toEqual({ categories: 1, accounts: 1, transactions: 2, rulesApplied: 0 });
    const run = await d.jobRuns.getById(result.jobRunId);
    expect(run?.status).toBe("SUCCESS");
    expect(run?.cursor).toBe("2026-06-13T10:00:00.000Z"); // = startedAt
    expect((await d.transactions.listByAccount("a1")).map((t) => t.id).sort()).toEqual(["t1", "t2"]);
    expect((await d.accounts.getById("a1"))?.balanceCents).toBe(1000);
  });

  it("is idempotent — a second run creates zero new rows", async () => {
    const up = fakeUp({ listAccounts: async () => [acc], listTransactions: async () => [upTxn("t1")] });
    const d = makeDeps(up);
    const svc = new SyncService(d);
    await svc.sync({ mode: "full" });
    await svc.sync({ mode: "full" });
    expect(await d.transactions.listByAccount("a1")).toHaveLength(1);
    expect(await d.accounts.list()).toHaveLength(1);
  });

  it("carries forward a user-assigned role + monthlyAllocationCents on re-sync", async () => {
    const up = fakeUp({ listAccounts: async () => [{ ...acc, attributes: { ...acc.attributes, accountType: "SAVER" } }] });
    const d = makeDeps(up);
    const svc = new SyncService(d);
    await svc.sync({ mode: "full" });
    // user re-roles the saver as the emergency fund
    await d.accounts.upsert({ id: "a1", name: "Spending", type: "SAVER", ownership: "INDIVIDUAL", balanceCents: 1000, role: "EMERGENCY", monthlyAllocationCents: 5000 });
    await svc.sync({ mode: "full" });
    const a = await d.accounts.getById("a1");
    expect(a?.role).toBe("EMERGENCY");
    expect(a?.monthlyAllocationCents).toBe(5000);
  });

  it("applies match rules to imported transactions and counts them", async () => {
    const up = fakeUp({ listAccounts: async () => [acc], listTransactions: async () => [upTxn("t1")] });
    const d = makeDeps(up, {
      matchRules: new InMemoryMatchRuleRepo([
        { rule: { id: "r", name: "Cafe", isActive: true, priority: 10 },
          conditions: [{ id: "c", ruleId: "r", field: "description", mode: "contains", value: "coffee", amountCents: null, toleranceCents: null, currency: null }],
          actions: [{ id: "a", ruleId: "r", type: "MARK_DEDUCTIBLE", value: "Meals", targetId: null }] },
      ]),
    });
    const svc = new SyncService(d);
    const result = await svc.sync({ mode: "full" });
    expect(result.counts.rulesApplied).toBe(1);
    expect((await d.transactions.getById("t1"))?.isTaxDeductible).toBe(true);
  });

  it("upserts categories and accounts before transactions (FK order)", async () => {
    const order: string[] = [];
    const up = fakeUp({
      listCategories: async () => { order.push("categories"); return [{ type: "categories", id: "c1", attributes: { name: "X" }, relationships: { parent: { data: null } } }]; },
      listAccounts: async () => { order.push("accounts"); return [acc]; },
      listTransactions: async () => { order.push("transactions"); return [upTxn("t1")]; },
    });
    const svc = new SyncService(makeDeps(up));
    await svc.sync({ mode: "full" });
    expect(order).toEqual(["categories", "accounts", "transactions"]);
  });
});

describe("SyncService.sync — incremental", () => {
  it("with no prior success, fetches with no since (full scan)", async () => {
    const up = fakeUp();
    const svc = new SyncService(makeDeps(up));
    await svc.sync({ mode: "incremental" });
    expect(up.sinceSeen).toEqual([]); // no since passed
  });

  it("with a prior successful cursor, fetches since cursor minus the overlap window", async () => {
    const up = fakeUp();
    const d = makeDeps(up);
    await d.jobRuns.create({ id: "prev", job: "SYNC", startedAt: "2026-06-10T00:00:00.000Z" });
    await d.jobRuns.finish("prev", { status: "SUCCESS", finishedAt: "2026-06-10T00:05:00.000Z", cursor: "2026-06-10T00:00:00.000Z", counts: null, error: null });
    const svc = new SyncService(d);
    await svc.sync({ mode: "incremental" });
    const expected = new Date(new Date("2026-06-10T00:00:00.000Z").getTime() - INCREMENTAL_OVERLAP_MS).toISOString();
    expect(up.sinceSeen).toEqual([expected]);
  });

  it("falls back to a full scan when the prior successful cursor is unparseable", async () => {
    const up = fakeUp();
    const d = makeDeps(up);
    await d.jobRuns.create({ id: "prev", job: "SYNC", startedAt: "2026-06-10T00:00:00.000Z" });
    await d.jobRuns.finish("prev", { status: "SUCCESS", finishedAt: "2026-06-10T00:05:00.000Z", cursor: "not-a-date", counts: null, error: null });
    const svc = new SyncService(d);
    const result = await svc.sync({ mode: "incremental" });
    expect(result.status).toBe("SUCCESS"); // does not throw RangeError
    expect(up.sinceSeen).toEqual([]); // poison cursor → no since (full scan)
  });
});

describe("SyncService.sync — failure", () => {
  it("records a FAILED job_run and flags authFailed on UpAuthError", async () => {
    const up = fakeUp({ listCategories: async () => { throw new UpAuthError(401, "/categories"); } });
    const d = makeDeps(up);
    const svc = new SyncService(d);
    const result = await svc.sync({ mode: "full" });
    expect(result.status).toBe("FAILED");
    expect(result.authFailed).toBe(true);
    const run = await d.jobRuns.getById(result.jobRunId);
    expect(run?.status).toBe("FAILED");
    expect(run?.error).toMatch(/auth/i);
    expect(run?.error).not.toMatch(/bearer|token/i);
  });

  it("flags a non-auth failure with authFailed false", async () => {
    const up = fakeUp({ listAccounts: async () => { throw new Error("network down"); } });
    const d = makeDeps(up);
    const result = await new SyncService(d).sync({ mode: "full" });
    expect(result.status).toBe("FAILED");
    expect(result.authFailed).toBe(false);
  });
});
