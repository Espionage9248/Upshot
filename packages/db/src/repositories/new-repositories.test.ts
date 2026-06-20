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
import { DrizzleAssetRepo } from "./asset-repo";
import { DrizzleAccountRepo } from "./account-repo";

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

describe("DrizzleMatchRuleRepo CRUD", () => {
  it("create, getById round-trip", async () => {
    const db = freshDb();
    const repo = new DrizzleMatchRuleRepo(db);
    const input = {
      rule: { id: "r10", name: "Rent", isActive: true, priority: 10 },
      conditions: [
        { id: "c10", ruleId: "r10", field: "description" as const, mode: "exact" as const, value: "Rent", amountCents: 200000, toleranceCents: 0, currency: "AUD" },
        { id: "c11", ruleId: "r10", field: "rawText" as const, mode: "contains" as const, value: "rent", amountCents: null, toleranceCents: null, currency: null },
      ],
      actions: [
        { id: "a10", ruleId: "r10", type: "RENAME" as const, value: "Monthly Rent", targetId: null },
      ],
    };
    await repo.create(input);
    const got = await repo.getById("r10");
    expect(got).not.toBeNull();
    expect(got?.rule.name).toBe("Rent");
    expect(got?.conditions).toHaveLength(2);
    expect(got?.conditions.map((c) => c.id).sort()).toEqual(["c10", "c11"]);
    expect(got?.actions).toHaveLength(1);
    expect(got?.actions[0]?.value).toBe("Monthly Rent");
  });

  it("getById returns null for unknown id", async () => {
    const repo = new DrizzleMatchRuleRepo(freshDb());
    expect(await repo.getById("no-such")).toBeNull();
  });

  it("update replaces children (old rows gone, new present)", async () => {
    const db = freshDb();
    const repo = new DrizzleMatchRuleRepo(db);
    await repo.create({
      rule: { id: "r20", name: "Old", isActive: true, priority: 1 },
      conditions: [{ id: "c20", ruleId: "r20", field: "description" as const, mode: "exact" as const, value: "foo", amountCents: null, toleranceCents: null, currency: null }],
      actions: [{ id: "a20", ruleId: "r20", type: "RENAME" as const, value: "Old Name", targetId: null }],
    });
    // Now update: rename, change condition, change action
    await repo.update({
      rule: { id: "r20", name: "New", isActive: false, priority: 2 },
      conditions: [{ id: "c21", ruleId: "r20", field: "categoryName" as const, mode: "startsWith" as const, value: "Food", amountCents: null, toleranceCents: null, currency: null }],
      actions: [{ id: "a21", ruleId: "r20", type: "MARK_SALARY" as const, value: null, targetId: null }],
    });
    const got = await repo.getById("r20");
    expect(got?.rule.name).toBe("New");
    expect(got?.rule.isActive).toBe(false);
    // old condition/action gone
    expect(got?.conditions.find((c) => c.id === "c20")).toBeUndefined();
    expect(got?.actions.find((a) => a.id === "a20")).toBeUndefined();
    // new condition/action present
    expect(got?.conditions).toHaveLength(1);
    expect(got?.conditions[0]?.id).toBe("c21");
    expect(got?.actions[0]?.id).toBe("a21");
  });

  it("delete removes rule and cascades to children", async () => {
    const db = freshDb();
    const repo = new DrizzleMatchRuleRepo(db);
    const { matchConditions: conds, matchActions: acts } = await import("../schema");
    await repo.create({
      rule: { id: "r30", name: "ToDelete", isActive: true, priority: 1 },
      conditions: [{ id: "c30", ruleId: "r30", field: "description" as const, mode: "exact" as const, value: "x", amountCents: null, toleranceCents: null, currency: null }],
      actions: [{ id: "a30", ruleId: "r30", type: "RENAME" as const, value: "x", targetId: null }],
    });
    await repo.delete("r30");
    expect(await repo.getById("r30")).toBeNull();
    // cascade deleted children
    const { eq } = await import("drizzle-orm");
    expect(db.select().from(conds).where(eq(conds.ruleId, "r30")).all()).toHaveLength(0);
    expect(db.select().from(acts).where(eq(acts.ruleId, "r30")).all()).toHaveLength(0);
  });

  it("loadAll includes inactive rule; loadActive excludes it", async () => {
    const db = freshDb();
    const repo = new DrizzleMatchRuleRepo(db);
    await repo.create({ rule: { id: "r40", name: "Active", isActive: true, priority: 10 }, conditions: [], actions: [] });
    await repo.create({ rule: { id: "r41", name: "Inactive", isActive: false, priority: 5 }, conditions: [], actions: [] });
    const all = await repo.loadAll();
    expect(all.map((r) => r.rule.id)).toEqual(["r41", "r40"]); // sorted by priority asc (5, 10)
    const active = await repo.loadActive();
    expect(active.map((r) => r.rule.id)).toEqual(["r40"]);
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

describe("DrizzleAssetRepo", () => {
  it("CRUD round-trip: create, getById, update, delete", async () => {
    const repo = new DrizzleAssetRepo(freshDb());

    const id = await repo.create({
      name: "PPOR",
      type: "PROPERTY",
      valueCents: 80000000,
      institution: "ANZ",
      notes: "Main home",
      includeInNetWorth: true,
    });
    expect(typeof id).toBe("string");

    const got = await repo.getById(id);
    expect(got).not.toBeNull();
    expect(got?.name).toBe("PPOR");
    expect(got?.valueCents).toBe(80000000);
    expect(got?.institution).toBe("ANZ");
    expect(got?.notes).toBe("Main home");
    expect(got?.includeInNetWorth).toBe(true);
    expect(got?.lastValuedAt).toBeNull();
    expect(got?.createdAt).toBeTruthy();
    expect(got?.updatedAt).toBeTruthy();

    // update
    await repo.update({ ...got!, name: "PPOR Updated", valueCents: 85000000 });
    const updated = await repo.getById(id);
    expect(updated?.name).toBe("PPOR Updated");
    expect(updated?.valueCents).toBe(85000000);

    // delete
    await repo.delete(id);
    expect(await repo.getById(id)).toBeNull();
  });

  it("getById returns null for unknown id", async () => {
    const repo = new DrizzleAssetRepo(freshDb());
    expect(await repo.getById("no-such")).toBeNull();
  });

  it("list returns assets ordered by name ascending", async () => {
    const repo = new DrizzleAssetRepo(freshDb());
    await repo.create({ name: "Zara Shares", type: "INVESTMENT", valueCents: 1000, institution: null, notes: null, includeInNetWorth: true });
    await repo.create({ name: "Apple Shares", type: "INVESTMENT", valueCents: 2000, institution: null, notes: null, includeInNetWorth: true });
    await repo.create({ name: "My Home", type: "PROPERTY", valueCents: 3000, institution: null, notes: null, includeInNetWorth: true });

    const list = await repo.list();
    expect(list.map((a) => a.name)).toEqual(["Apple Shares", "My Home", "Zara Shares"]);
  });

  it("recordValuation appends to history and bumps assets.valueCents + lastValuedAt", async () => {
    const repo = new DrizzleAssetRepo(freshDb());
    const id = await repo.create({
      name: "Shares",
      type: "INVESTMENT",
      valueCents: 50000,
      institution: null,
      notes: null,
      includeInNetWorth: true,
    });

    await repo.recordValuation(id, 55000, "2026-06-01T00:00:00.000Z");
    const after1 = await repo.getById(id);
    expect(after1?.valueCents).toBe(55000);
    expect(after1?.lastValuedAt).toBe("2026-06-01T00:00:00.000Z");

    await repo.recordValuation(id, 60000, "2026-06-15T00:00:00.000Z");
    const after2 = await repo.getById(id);
    expect(after2?.valueCents).toBe(60000);
    expect(after2?.lastValuedAt).toBe("2026-06-15T00:00:00.000Z");

    const history = await repo.listValuations(id);
    expect(history).toHaveLength(2);
    // ordered by valuedAt ascending
    expect(history[0]?.valuedAt).toBe("2026-06-01T00:00:00.000Z");
    expect(history[0]?.valueCents).toBe(55000);
    expect(history[1]?.valuedAt).toBe("2026-06-15T00:00:00.000Z");
    expect(history[1]?.valueCents).toBe(60000);
    expect(history[0]?.assetId).toBe(id);
  });

  it("delete cascades to asset_valuations", async () => {
    const repo = new DrizzleAssetRepo(freshDb());
    const id = await repo.create({
      name: "Car",
      type: "VEHICLE",
      valueCents: 3000000,
      institution: null,
      notes: null,
      includeInNetWorth: true,
    });
    await repo.recordValuation(id, 2900000, "2026-05-01T00:00:00.000Z");
    await repo.recordValuation(id, 2800000, "2026-06-01T00:00:00.000Z");

    // confirm valuations exist
    expect(await repo.listValuations(id)).toHaveLength(2);

    // delete asset — valuations should cascade
    await repo.delete(id);
    expect(await repo.getById(id)).toBeNull();
    // listValuations of deleted asset should be empty (cascaded)
    expect(await repo.listValuations(id)).toHaveLength(0);
  });
});

describe("DrizzleAccountRepo.setGoal", () => {
  it("setGoal round-trips: sets goal fields, getById returns them", async () => {
    const db = freshDb();
    const repo = new DrizzleAccountRepo(db);
    await repo.upsert({
      id: "saver-1", name: "Holiday", type: "SAVER", ownership: "INDIVIDUAL",
      balanceCents: 100000, role: "SAVER", monthlyAllocationCents: 5000,
    });

    await repo.setGoal("saver-1", 500000, "2027-01-01");

    const got = await repo.getById("saver-1");
    expect(got?.goalTargetCents).toBe(500000);
    expect(got?.goalTargetDate).toBe("2027-01-01");
  });

  it("setGoal can clear goal fields back to null", async () => {
    const db = freshDb();
    const repo = new DrizzleAccountRepo(db);
    await repo.upsert({
      id: "saver-1", name: "Holiday", type: "SAVER", ownership: "INDIVIDUAL",
      balanceCents: 100000, role: "SAVER", monthlyAllocationCents: 5000,
    });
    await repo.setGoal("saver-1", 500000, "2027-01-01");
    await repo.setGoal("saver-1", null, null);

    const got = await repo.getById("saver-1");
    expect(got?.goalTargetCents).toBeNull();
    expect(got?.goalTargetDate).toBeNull();
  });

  it("sync upsert (no goal fields) preserves a previously-set goal — sync-clobber guard", async () => {
    const db = freshDb();
    const repo = new DrizzleAccountRepo(db);
    // Initial upsert, then set a goal
    await repo.upsert({
      id: "saver-1", name: "Holiday", type: "SAVER", ownership: "INDIVIDUAL",
      balanceCents: 100000, role: "SAVER", monthlyAllocationCents: 5000,
    });
    await repo.setGoal("saver-1", 500000, "2027-01-01");

    // Simulate a sync upsert: no goal fields provided (absent, not explicitly null)
    await repo.upsert({
      id: "saver-1", name: "Holiday Fund", type: "SAVER", ownership: "INDIVIDUAL",
      balanceCents: 120000, role: "SAVER", monthlyAllocationCents: 5000,
    });

    // Goal must be preserved; sync must not clobber it
    const after = await repo.getById("saver-1");
    expect(after?.goalTargetCents).toBe(500000);
    expect(after?.goalTargetDate).toBe("2027-01-01");
    expect(after?.balanceCents).toBe(120000); // sync update applied
  });
});
