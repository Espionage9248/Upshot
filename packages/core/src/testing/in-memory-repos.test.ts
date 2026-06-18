// packages/core/src/testing/in-memory-repos.test.ts
import { describe, it, expect } from "vitest";
import { InMemoryJobRunRepo } from "./in-memory-job-run-repo";
import { InMemoryCategoryRepo } from "./in-memory-category-repo";
import { InMemoryMatchRuleRepo } from "./in-memory-match-rule-repo";
import { InMemorySettingsRepo } from "./in-memory-settings-repo";

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
