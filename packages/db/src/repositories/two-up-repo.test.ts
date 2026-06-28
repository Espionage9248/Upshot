import { afterEach, describe, it, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDbClient, type DbClient } from "../client";
import { applyMigrations } from "../migrate";
import { DrizzleTwoUpRepo } from "./two-up-repo";
import type { TwoUpTxn } from "@upshot/core";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];
function freshDb(): DbClient {
  const dir = mkdtempSync(join(tmpdir(), "upshot-2up-")); dirs.push(dir);
  const { db } = createDbClient({ url: join(dir, "x.db"), key: KEY });
  applyMigrations(db as DbClient);
  return db as DbClient;
}
afterEach(() => { while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true }); });

const row = (over: Partial<TwoUpTxn>): TwoUpTxn => ({
  id: "id1", rowHash: "rh1", date: "2022-01-01", description: "Coles",
  amountCents: -4250, owner: "SHARED", category: "Groceries", ...over,
});

describe("DrizzleTwoUpRepo", () => {
  it("upsertMany inserts new rows and skips existing rowHashes", () => {
    const repo = new DrizzleTwoUpRepo(freshDb());
    expect(repo.upsertMany([row({ id: "a", rowHash: "h1" }), row({ id: "b", rowHash: "h2" })])).toBe(2);
    expect(repo.upsertMany([row({ id: "a2", rowHash: "h1" })])).toBe(0); // skip existing
    expect(repo.list()).toHaveLength(2);
  });
  it("round-trips owner via the contributor column", () => {
    const repo = new DrizzleTwoUpRepo(freshDb());
    repo.upsertMany([row({ id: "a", rowHash: "h1", owner: "UNASSIGNED" })]);
    expect(repo.list()[0]!.owner).toBe("UNASSIGNED");
  });
  it("updateAttribution preserves the row and changes only the given fields", () => {
    const repo = new DrizzleTwoUpRepo(freshDb());
    repo.upsertMany([row({ id: "a", rowHash: "h1", owner: "SHARED", category: "Groceries" })]);
    repo.updateAttribution("a", { owner: "JAMES" });
    const r = repo.list()[0]!;
    expect(r.owner).toBe("JAMES");
    expect(r.category).toBe("Groceries"); // unchanged
    expect(r.rowHash).toBe("h1");
  });
});
