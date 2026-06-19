// packages/core/src/testing/in-memory-repos.test.ts
import { describe, it, expect } from "vitest";
import { InMemoryJobRunRepo } from "./in-memory-job-run-repo";
import { InMemoryCategoryRepo } from "./in-memory-category-repo";
import { InMemoryMatchRuleRepo } from "./in-memory-match-rule-repo";
import { InMemorySettingsRepo } from "./in-memory-settings-repo";
import { FakeAssetRepo } from "./fake-asset-repo";

describe("InMemoryJobRunRepo", () => {
  it("creates RUNNING, finishes, and reads back", async () => {
    const repo = new InMemoryJobRunRepo();
    const run = await repo.create({ id: "j1", job: "SYNC", startedAt: "2026-06-13T00:00:00.000Z" });
    expect(run.status).toBe("RUNNING");
    await repo.finish("j1", { status: "SUCCESS", finishedAt: "2026-06-13T00:01:00.000Z", cursor: "2026-06-13T00:00:00.000Z", counts: { transactions: 3 }, error: null });
    const got = await repo.getById("j1");
    expect(got?.status).toBe("SUCCESS");
    expect(got?.counts).toEqual({ transactions: 3 });
  });

  it("latestSuccessfulCursor returns the newest SUCCESS cursor, ignoring FAILED runs", async () => {
    const repo = new InMemoryJobRunRepo();
    await repo.create({ id: "old", job: "SYNC", startedAt: "2026-06-10T00:00:00.000Z" });
    await repo.finish("old", { status: "SUCCESS", finishedAt: "2026-06-10T00:01:00.000Z", cursor: "2026-06-10T00:00:00.000Z", counts: null, error: null });
    await repo.create({ id: "new", job: "SYNC", startedAt: "2026-06-12T00:00:00.000Z" });
    await repo.finish("new", { status: "SUCCESS", finishedAt: "2026-06-12T00:01:00.000Z", cursor: "2026-06-12T00:00:00.000Z", counts: null, error: null });
    await repo.create({ id: "fail", job: "SYNC", startedAt: "2026-06-13T00:00:00.000Z" });
    await repo.finish("fail", { status: "FAILED", finishedAt: "2026-06-13T00:01:00.000Z", cursor: null, counts: null, error: "boom" });
    expect(await repo.latestSuccessfulCursor("SYNC")).toBe("2026-06-12T00:00:00.000Z");
    expect((await repo.latest("SYNC"))?.id).toBe("fail");
  });
});

describe("InMemoryCategoryRepo", () => {
  it("upserts idempotently by id", async () => {
    const repo = new InMemoryCategoryRepo();
    await repo.upsert({ id: "c1", name: "Old", parentId: null });
    await repo.upsert({ id: "c1", name: "New", parentId: "p1" });
    expect(await repo.list()).toEqual([{ id: "c1", name: "New", parentId: "p1" }]);
  });
});

describe("InMemoryMatchRuleRepo", () => {
  it("returns the preloaded rules sorted ascending by priority", async () => {
    const repo = new InMemoryMatchRuleRepo([
      { rule: { id: "b", name: "B", isActive: true, priority: 20 }, conditions: [], actions: [] },
      { rule: { id: "a", name: "A", isActive: true, priority: 10 }, conditions: [], actions: [] },
    ]);
    expect((await repo.loadActive()).map((r) => r.rule.id)).toEqual(["a", "b"]);
  });

  it("filters out inactive rules", async () => {
    const repo = new InMemoryMatchRuleRepo([
      { rule: { id: "on", name: "On", isActive: true, priority: 10 }, conditions: [], actions: [] },
      { rule: { id: "off", name: "Off", isActive: false, priority: 5 }, conditions: [], actions: [] },
    ]);
    expect((await repo.loadActive()).map((r) => r.rule.id)).toEqual(["on"]);
  });

  it("loadAll includes inactive, sorted by priority", async () => {
    const repo = new InMemoryMatchRuleRepo([
      { rule: { id: "b", name: "B", isActive: true, priority: 20 }, conditions: [], actions: [] },
      { rule: { id: "a", name: "A", isActive: false, priority: 10 }, conditions: [], actions: [] },
    ]);
    expect((await repo.loadAll()).map((r) => r.rule.id)).toEqual(["a", "b"]);
  });

  it("getById returns the matching rule or null", async () => {
    const repo = new InMemoryMatchRuleRepo([
      { rule: { id: "x", name: "X", isActive: true, priority: 1 }, conditions: [], actions: [] },
    ]);
    expect((await repo.getById("x"))?.rule.name).toBe("X");
    expect(await repo.getById("nope")).toBeNull();
  });

  it("create, update, delete mutate the collection", async () => {
    const repo = new InMemoryMatchRuleRepo();
    await repo.create({ rule: { id: "m1", name: "Init", isActive: true, priority: 1 }, conditions: [], actions: [] });
    expect(await repo.getById("m1")).not.toBeNull();
    await repo.update({ rule: { id: "m1", name: "Updated", isActive: false, priority: 2 }, conditions: [], actions: [] });
    expect((await repo.getById("m1"))?.rule.name).toBe("Updated");
    await repo.delete("m1");
    expect(await repo.getById("m1")).toBeNull();
  });
});

describe("InMemorySettingsRepo", () => {
  it("returns the preloaded settings or null", async () => {
    expect(await new InMemorySettingsRepo(null).get()).toBeNull();
    const repo = new InMemorySettingsRepo({ syncCadence: "HOURLY" } as never);
    expect((await repo.get())?.syncCadence).toBe("HOURLY");
  });
});

describe("FakeAssetRepo", () => {
  it("create, getById, update, delete round-trip", async () => {
    const repo = new FakeAssetRepo();
    const id = await repo.create({
      name: "PPOR",
      type: "PROPERTY",
      valueCents: 80000000,
      institution: "ANZ",
      notes: null,
      includeInNetWorth: true,
    });
    expect(typeof id).toBe("string");

    const got = await repo.getById(id);
    expect(got?.name).toBe("PPOR");
    expect(got?.valueCents).toBe(80000000);
    expect(got?.lastValuedAt).toBeNull();

    await repo.update({ ...got!, name: "Updated PPOR", valueCents: 85000000 });
    expect((await repo.getById(id))?.name).toBe("Updated PPOR");

    await repo.delete(id);
    expect(await repo.getById(id)).toBeNull();
  });

  it("list returns assets ordered by name ascending", async () => {
    const repo = new FakeAssetRepo();
    await repo.create({ name: "Zara", type: "INVESTMENT", valueCents: 1, institution: null, notes: null, includeInNetWorth: true });
    await repo.create({ name: "Apple", type: "INVESTMENT", valueCents: 2, institution: null, notes: null, includeInNetWorth: true });
    const names = (await repo.list()).map((a) => a.name);
    expect(names).toEqual(["Apple", "Zara"]);
  });

  it("recordValuation appends history and bumps valueCents + lastValuedAt", async () => {
    const repo = new FakeAssetRepo();
    const id = await repo.create({ name: "Shares", type: "INVESTMENT", valueCents: 1000, institution: null, notes: null, includeInNetWorth: true });

    await repo.recordValuation(id, 2000, "2026-06-01T00:00:00.000Z");
    expect((await repo.getById(id))?.valueCents).toBe(2000);
    expect((await repo.getById(id))?.lastValuedAt).toBe("2026-06-01T00:00:00.000Z");

    await repo.recordValuation(id, 3000, "2026-06-15T00:00:00.000Z");
    const history = await repo.listValuations(id);
    expect(history).toHaveLength(2);
    expect(history[0]?.valuedAt).toBe("2026-06-01T00:00:00.000Z");
    expect(history[1]?.valuedAt).toBe("2026-06-15T00:00:00.000Z");
  });

  it("delete cascades to valuations", async () => {
    const repo = new FakeAssetRepo();
    const id = await repo.create({ name: "Car", type: "VEHICLE", valueCents: 3000, institution: null, notes: null, includeInNetWorth: true });
    await repo.recordValuation(id, 2500, "2026-05-01T00:00:00.000Z");

    await repo.delete(id);
    expect(await repo.listValuations(id)).toHaveLength(0);
  });
});
