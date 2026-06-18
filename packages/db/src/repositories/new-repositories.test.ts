import { afterEach, describe, it, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDbClient, type DbClient } from "../client";
import { applyMigrations } from "../migrate";
import { DrizzleJobRunRepo } from "./job-run-repo";
import { DrizzleCategoryRepo } from "./category-repo";
import { DrizzleMatchRuleRepo } from "./match-rule-repo";
import { DrizzleSettingsRepo } from "./settings-repo";
import { DrizzleBudgetAllocationRepo } from "./budget-allocation-repo";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function freshDb(): DbClient {
  const dir = mkdtempSync(join(tmpdir(), "upshot-newrepo-"));
  dirs.push(dir);
  const { db } = createDbClient({ url: join(dir, "x.db"), key: KEY });
  applyMigrations(db as DbClient);
  return db as DbClient;
}

afterEach(() => { while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true }); });

describe("DrizzleJobRunRepo", () => {
  it("creates RUNNING, finishes SUCCESS, and exposes the latest successful cursor", async () => {
    const repo = new DrizzleJobRunRepo(freshDb());
    await repo.create({ id: "j1", job: "SYNC", startedAt: "2026-06-13T00:00:00.000Z" });
    await repo.finish("j1", { status: "SUCCESS", finishedAt: "2026-06-13T00:01:00.000Z", cursor: "2026-06-13T00:00:00.000Z", counts: { transactions: 5 }, error: null });
    const got = await repo.getById("j1");
    expect(got?.status).toBe("SUCCESS");
    expect(got?.counts).toEqual({ transactions: 5 });
    expect(await repo.latestSuccessfulCursor("SYNC")).toBe("2026-06-13T00:00:00.000Z");
    expect((await repo.latest("SYNC"))?.id).toBe("j1");
  });

  it("ignores FAILED runs for the cursor", async () => {
    const repo = new DrizzleJobRunRepo(freshDb());
    await repo.create({ id: "ok", job: "SYNC", startedAt: "2026-06-12T00:00:00.000Z" });
    await repo.finish("ok", { status: "SUCCESS", finishedAt: "2026-06-12T00:01:00.000Z", cursor: "2026-06-12T00:00:00.000Z", counts: null, error: null });
    await repo.create({ id: "bad", job: "SYNC", startedAt: "2026-06-13T00:00:00.000Z" });
    await repo.finish("bad", { status: "FAILED", finishedAt: "2026-06-13T00:01:00.000Z", cursor: null, counts: null, error: "Up API auth failed (HTTP 401)" });
    expect(await repo.latestSuccessfulCursor("SYNC")).toBe("2026-06-12T00:00:00.000Z");
  });
});

describe("DrizzleCategoryRepo", () => {
  it("upserts and lists", async () => {
    const repo = new DrizzleCategoryRepo(freshDb());
    await repo.upsert({ id: "c1", name: "Old", parentId: null });
    await repo.upsert({ id: "c1", name: "New", parentId: "p1" });
    expect(await repo.list()).toEqual([{ id: "c1", name: "New", parentId: "p1" }]);
  });
});

describe("DrizzleMatchRuleRepo", () => {
  it("loads active rules with conditions + actions, ascending by priority", async () => {
    const db = freshDb();
    const repo = new DrizzleMatchRuleRepo(db);
    const { matchRules, matchConditions, matchActions } = await import("../schema");
    db.insert(matchRules).values([
      { id: "r2", name: "Salary", isActive: true, priority: 20 },
      { id: "r1", name: "Patreon", isActive: true, priority: 10 },
      { id: "r3", name: "Off", isActive: false, priority: 5 },
    ]).run();
    db.insert(matchConditions).values([
      { id: "c1", ruleId: "r1", field: "description", mode: "exact", value: "Patreon", amountCents: 770, toleranceCents: 100, currency: "USD" },
    ]).run();
    db.insert(matchActions).values([
      { id: "a1", ruleId: "r1", type: "RENAME", value: "Patreon - TrueAnon", targetId: null },
      { id: "a2", ruleId: "r2", type: "MARK_SALARY", value: null, targetId: null },
    ]).run();

    const loaded = await repo.loadActive();
    expect(loaded.map((l) => l.rule.id)).toEqual(["r1", "r2"]); // r3 inactive, sorted by priority
    expect(loaded[0]?.conditions).toHaveLength(1);
    expect(loaded[0]?.conditions[0]?.currency).toBe("USD");
    expect(loaded[0]?.actions[0]?.type).toBe("RENAME");
    expect(loaded[1]?.actions[0]?.type).toBe("MARK_SALARY");
  });
});

describe("DrizzleSettingsRepo", () => {
  it("returns null when unseeded and the row after upsert", async () => {
    const db = freshDb();
    const repo = new DrizzleSettingsRepo(db);
    expect(await repo.get()).toBeNull();
    const { appSettings } = await import("../schema");
    db.insert(appSettings).values({ id: "default", syncCadence: "HOURLY" }).run();
    expect((await repo.get())?.syncCadence).toBe("HOURLY");
  });
});

describe("DrizzleBudgetAllocationRepo", () => {
  it("upserts, reads back with correct varianceCents, updates in place, and filters by month", async () => {
    const db = freshDb();
    // Seed a parent account to satisfy the FK constraint.
    const { accounts } = await import("../schema");
    db.insert(accounts).values({
      id: "acc1",
      name: "Spending",
      type: "TRANSACTIONAL",
      ownership: "INDIVIDUAL",
      balanceCents: 100000,
      role: "SPENDING",
      monthlyAllocationCents: 0,
      lastSyncedAt: null,
      updatedAt: new Date().toISOString(),
    }).run();

    const repo = new DrizzleBudgetAllocationRepo(db);

    // upsert then getByAccountMonth returns the row with varianceCents === allocatedCents - spentCents
    await repo.upsert({ id: "ba1", accountId: "acc1", month: "2026-06", year: 2026, allocatedCents: 50000, spentCents: 20000, notes: null });
    const got = await repo.getByAccountMonth("acc1", "2026-06");
    expect(got).not.toBeNull();
    expect(got?.allocatedCents).toBe(50000);
    expect(got?.spentCents).toBe(20000);
    expect(got?.varianceCents).toBe(30000); // 50000 - 20000

    // second upsert for same (accountId, month) updates in place — no duplicate
    await repo.upsert({ id: "ba1", accountId: "acc1", month: "2026-06", year: 2026, allocatedCents: 60000, spentCents: 25000, notes: null });
    const updated = await repo.getByAccountMonth("acc1", "2026-06");
    expect(updated?.allocatedCents).toBe(60000);
    expect(updated?.varianceCents).toBe(35000); // 60000 - 25000
    const all = await repo.listByMonth("2026-06");
    expect(all).toHaveLength(1); // no duplicate row

    // listByMonth filters by month — different month not returned
    await repo.upsert({ id: "ba2", accountId: "acc1", month: "2026-07", year: 2026, allocatedCents: 70000, spentCents: 0, notes: null });
    const juneOnly = await repo.listByMonth("2026-06");
    expect(juneOnly).toHaveLength(1);
    expect(juneOnly[0]?.month).toBe("2026-06");
    const julyOnly = await repo.listByMonth("2026-07");
    expect(julyOnly).toHaveLength(1);
    expect(julyOnly[0]?.varianceCents).toBe(70000); // 70000 - 0
  });
});
