import { afterEach, describe, it, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDbClient, applyMigrations, seed, type DbClient } from "@upshot/db";
import { saveLayout, loadLayout, type DashboardWidget } from "./dashboard-core";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function freshDb(): DbClient {
  const dir = mkdtempSync(join(tmpdir(), "upshot-dash-"));
  dirs.push(dir);
  const { db } = createDbClient({ url: join(dir, "x.db"), key: KEY });
  applyMigrations(db as DbClient);
  seed(db as DbClient);
  return db as DbClient;
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

const widgets: DashboardWidget[] = [
  { id: "w-a", widgetKey: "net-worth", position: 0, size: "md", visible: true, config: null },
  { id: "w-b", widgetKey: "safe-to-spend", position: 1, size: "lg", visible: false, config: null },
  { id: "w-c", widgetKey: "upcoming", position: 2, size: "sm", visible: true, config: { foo: 1 } },
];

describe("dashboard layout persistence", () => {
  it("round-trips order (position), size and visibility", async () => {
    const db = freshDb();
    await saveLayout(db, widgets);

    const loaded = await loadLayout(db);
    expect(loaded.map((w) => w.widgetKey)).toEqual(["net-worth", "safe-to-spend", "upcoming"]);
    expect(loaded.map((w) => w.position)).toEqual([0, 1, 2]);
    expect(loaded.map((w) => w.size)).toEqual(["md", "lg", "sm"]);
    expect(loaded.map((w) => w.visible)).toEqual([true, false, true]);
    expect(loaded[2]?.config).toEqual({ foo: 1 });
  });

  it("returns widgets ordered by position regardless of insert order", async () => {
    const db = freshDb();
    const shuffled = [widgets[2]!, widgets[0]!, widgets[1]!];
    await saveLayout(db, shuffled);

    const loaded = await loadLayout(db);
    expect(loaded.map((w) => w.position)).toEqual([0, 1, 2]);
    expect(loaded.map((w) => w.widgetKey)).toEqual(["net-worth", "safe-to-spend", "upcoming"]);
  });

  it("replaces the prior layout on re-save (no duplicate or stale rows)", async () => {
    const db = freshDb();
    await saveLayout(db, widgets);

    const next: DashboardWidget[] = [
      { id: "w-x", widgetKey: "streak", position: 0, size: "sm", visible: true, config: null },
    ];
    await saveLayout(db, next);

    const loaded = await loadLayout(db);
    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.widgetKey).toBe("streak");
  });

  it("returns [] on an empty DB so the caller can fall back to defaults", async () => {
    const db = freshDb();
    const loaded = await loadLayout(db);
    expect(loaded).toEqual([]);
  });
});
