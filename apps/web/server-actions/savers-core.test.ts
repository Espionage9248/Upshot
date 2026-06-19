import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createDbClient, applyMigrations, tables, type DbClient } from "@upshot/db";
import { setSaverGoal } from "./savers-core";

// 32 hex chars — matches the encrypted-DB key contract.
const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function tempDbPath(): string {
  const dir = mkdtempSync(join(tmpdir(), "upshot-savers-"));
  dirs.push(dir);
  return join(dir, "test.db");
}

let db: DbClient;
let saverId: string;

beforeEach(() => {
  const client = createDbClient({ url: tempDbPath(), key: KEY });
  applyMigrations(client.db);
  db = client.db;

  // Seed a saver account row.
  saverId = randomUUID();
  db.insert(tables.accounts)
    .values({
      id: saverId,
      name: "Holiday Fund",
      type: "SAVER",
      ownership: "INDIVIDUAL",
      balanceCents: 100000,
      role: "SAVER",
    })
    .run();
});

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

function saverGoalEventRows() {
  return db
    .select()
    .from(tables.eventLog)
    .all()
    .filter((e) => e.category === "account" && e.action === "set_saver_goal");
}

// ---------------------------------------------------------------------------
// setSaverGoal
// ---------------------------------------------------------------------------

describe("setSaverGoal", () => {
  it("sets a goal on a saver and writes an event_log row", async () => {
    await setSaverGoal(db, saverId, 500000, "2026-12-31");

    const row = db.select().from(tables.accounts).get();
    expect(row).not.toBeNull();
    expect(row!.goalTargetCents).toBe(500000);
    expect(row!.goalTargetDate).toBe("2026-12-31");

    const logs = saverGoalEventRows();
    expect(logs).toHaveLength(1);
    expect(logs[0]!.action).toBe("set_saver_goal");
    expect(logs[0]!.category).toBe("account");
    expect(logs[0]!.entityId).toBe(saverId);
  });

  it("clears a goal (both null) and writes a second event_log row", async () => {
    // First set a goal.
    await setSaverGoal(db, saverId, 500000, "2026-12-31");

    // Then clear it.
    await setSaverGoal(db, saverId, null, null);

    const row = db.select().from(tables.accounts).get();
    expect(row).not.toBeNull();
    expect(row!.goalTargetCents).toBeNull();
    expect(row!.goalTargetDate).toBeNull();

    const logs = saverGoalEventRows();
    expect(logs).toHaveLength(2);
    expect(logs[1]!.action).toBe("set_saver_goal");
    expect(logs[1]!.category).toBe("account");
    expect(logs[1]!.entityId).toBe(saverId);
  });
});
