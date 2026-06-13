import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDbClient, type DbClient } from "./client";
import { applyMigrations } from "./migrate";
import { seed } from "./seed";
import { appSettings, matchRules, matchConditions, matchActions } from "./schema";

const KEY = "0123456789abcdef0123456789abcdef";
let dir: string;
let db: DbClient;
let raw: { close(): void };

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "upshot-seed-"));
  const client = createDbClient({ url: join(dir, "seed.db"), key: KEY });
  db = client.db;
  raw = client.raw;
  applyMigrations(db);
});

afterEach(() => {
  raw.close();
  rmSync(dir, { recursive: true, force: true });
});

describe("seed", () => {
  it("inserts the default settings row and a generic interest rule", () => {
    seed(db);
    expect(db.select().from(appSettings).all()).toHaveLength(1);
    const rule = db.select().from(matchRules).all();
    expect(rule).toHaveLength(1);
    expect(rule[0]?.name).toBe("Saver interest");
    const action = db.select().from(matchActions).all();
    expect(action[0]?.type).toBe("MARK_INTEREST");
  });

  it("is idempotent (re-seeding adds nothing)", () => {
    seed(db);
    seed(db);
    expect(db.select().from(appSettings).all()).toHaveLength(1);
    expect(db.select().from(matchRules).all()).toHaveLength(1);
    expect(db.select().from(matchConditions).all()).toHaveLength(1);
    expect(db.select().from(matchActions).all()).toHaveLength(1);
  });
});
