import { afterEach, describe, it, expect, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createDbClient, applyMigrations,
  DrizzleAccountRepo, DrizzleTransactionRepo, DrizzleCategoryRepo,
  DrizzleMatchRuleRepo, DrizzleJobRunRepo, type DbClient,
} from "@upshot/db";
import { SyncService, UpClient } from "@upshot/core";
import { startFixtureServer, type FixtureServer } from "@upshot/core/fixture-server";
import { runSyncOnce } from "./scheduler";
import { CircuitBreaker } from "./circuit-breaker";
import type { Notifier } from "./notifier";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];
let server: FixtureServer;

afterEach(() => {
  server?.close();
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

function freshDb(): DbClient {
  const dir = mkdtempSync(join(tmpdir(), "upshot-e2e-"));
  dirs.push(dir);
  const { db } = createDbClient({ url: join(dir, "e2e.db"), key: KEY });
  applyMigrations(db as DbClient);
  return db as DbClient;
}

function makeService(db: DbClient): SyncService {
  return new SyncService({
    up: new UpClient({ token: "test-token", baseUrl: server.url, retry: { sleep: () => Promise.resolve(), maxAttempts: 3 } }),
    accounts: new DrizzleAccountRepo(db),
    transactions: new DrizzleTransactionRepo(db),
    categories: new DrizzleCategoryRepo(db),
    matchRules: new DrizzleMatchRuleRepo(db),
    jobRuns: new DrizzleJobRunRepo(db),
  });
}

const okRoutes = {
  "GET /categories": { body: { data: [{ type: "categories", id: "cafes", attributes: { name: "Cafés" }, relationships: { parent: { data: null } } }], links: { prev: null, next: null } } },
  "GET /accounts": { body: { data: [{ type: "accounts", id: "a1", attributes: { displayName: "Spending", accountType: "TRANSACTIONAL", ownershipType: "INDIVIDUAL", balance: { currencyCode: "AUD", value: "12.34", valueInBaseUnits: 1234 }, createdAt: "2026-01-01T00:00:00Z" } }], links: { prev: null, next: null } } },
  "GET /transactions?page%5Bsize%5D=100": {
    body: {
      data: [
        { type: "transactions", id: "t1", attributes: { status: "SETTLED", description: "Coffee", message: null, rawText: null, amount: { currencyCode: "AUD", value: "-5.00", valueInBaseUnits: -500 }, foreignAmount: null, cardPurchaseMethod: null, roundUp: null, cashback: null, note: null, settledAt: null, createdAt: "2026-06-12T00:00:00Z" }, relationships: { account: { data: { type: "accounts", id: "a1" } }, transferAccount: { data: null }, category: { data: { type: "categories", id: "cafes" } }, parentCategory: { data: null }, tags: { data: [] }, attachment: { data: null } } },
      ],
      links: { prev: null, next: null },
    },
  },
};

describe("worker end-to-end against the fixture server", () => {
  it("syncs deterministically and re-running creates zero duplicates", async () => {
    server = await startFixtureServer(okRoutes);
    const db = freshDb();
    const svc = makeService(db);

    const first = await svc.sync({ mode: "full" });
    expect(first.status).toBe("SUCCESS");
    expect(first.counts).toEqual({ categories: 1, accounts: 1, transactions: 1, rulesApplied: 0 });

    const second = await svc.sync({ mode: "full" });
    expect(second.status).toBe("SUCCESS");

    expect(await new DrizzleTransactionRepo(db).listByAccount("a1")).toHaveLength(1);
    expect(await new DrizzleAccountRepo(db).list()).toHaveLength(1);
    expect((await new DrizzleAccountRepo(db).getById("a1"))?.balanceCents).toBe(1234);
  });

  it("on a forced failure writes a FAILED job_run and fires a (mocked) ntfy alert", async () => {
    server = await startFixtureServer({ ...okRoutes, "GET /accounts": { status: 500, body: { errors: [] } } });
    const db = freshDb();
    const svc = makeService(db);
    const notify = vi.fn().mockResolvedValue(undefined);
    const notifier: Notifier = { notify };

    const outcome = await runSyncOnce(svc, notifier, new CircuitBreaker(3), { notifyOnSyncFail: true });

    expect(outcome.status).toBe("FAILED");
    expect(notify).toHaveBeenCalledTimes(1);
    const latest = await new DrizzleJobRunRepo(db).latest("SYNC");
    expect(latest?.status).toBe("FAILED");
    expect(latest?.error).toContain("500");
  });

  it("a 401 produces an urgent reconnect alert and an auth-flagged FAILED run that never leaks the token", async () => {
    server = await startFixtureServer({ ...okRoutes, "GET /categories": { status: 401, body: { errors: [] } } });
    const db = freshDb();
    const svc = makeService(db);
    const notify = vi.fn().mockResolvedValue(undefined);

    const outcome = await runSyncOnce(svc, { notify }, new CircuitBreaker(3), { notifyOnSyncFail: true });

    expect(outcome.status).toBe("FAILED");
    expect("authFailed" in outcome && outcome.authFailed).toBe(true);
    expect(notify.mock.calls[0]?.[0]?.priority).toBe("urgent");
    const latest = await new DrizzleJobRunRepo(db).latest("SYNC");
    expect(latest?.error).not.toMatch(/bearer|test-token/i);
  });
});
