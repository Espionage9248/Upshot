import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createDbClient,
  applyMigrations,
  tables,
  DrizzleAssetRepo,
  type DbClient,
} from "@upshot/db";
import { createAsset, updateAsset, deleteAsset, recordValuation } from "./assets-core";

// 32 hex chars — matches the encrypted-DB key contract.
const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function tempDbPath(): string {
  const dir = mkdtempSync(join(tmpdir(), "upshot-assets-"));
  dirs.push(dir);
  return join(dir, "test.db");
}

let db: DbClient;

beforeEach(() => {
  const client = createDbClient({ url: tempDbPath(), key: KEY });
  applyMigrations(client.db);
  db = client.db;
});

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

function assetLogRows() {
  return db.select().from(tables.eventLog).all().filter((e) => e.category === "asset");
}

// ---------------------------------------------------------------------------
// createAsset
// ---------------------------------------------------------------------------

describe("createAsset", () => {
  it("persists a new asset and returns its id, event_log written", async () => {
    const id = await createAsset(db, {
      name: "Home",
      type: "PROPERTY",
      valueCents: 80000000,
      institution: null,
      notes: null,
      includeInNetWorth: true,
    });

    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);

    const found = await new DrizzleAssetRepo(db).getById(id);
    expect(found).not.toBeNull();
    expect(found!.name).toBe("Home");
    expect(found!.valueCents).toBe(80000000);
    expect(found!.type).toBe("PROPERTY");
    expect(found!.includeInNetWorth).toBe(true);

    const logs = assetLogRows();
    expect(logs).toHaveLength(1);
    expect(logs[0]!.action).toBe("create_asset");
    expect(logs[0]!.entityId).toBe(id);
    expect(logs[0]!.entityType).toBe("asset");
  });
});

// ---------------------------------------------------------------------------
// updateAsset
// ---------------------------------------------------------------------------

describe("updateAsset", () => {
  it("changes a field on the asset, event_log written", async () => {
    const id = await createAsset(db, {
      name: "Car",
      type: "VEHICLE",
      valueCents: 2000000,
      institution: null,
      notes: null,
      includeInNetWorth: true,
    });

    const asset = await new DrizzleAssetRepo(db).getById(id);
    expect(asset).not.toBeNull();

    await updateAsset(db, { ...asset!, name: "Old Car", valueCents: 1500000 });

    const updated = await new DrizzleAssetRepo(db).getById(id);
    expect(updated!.name).toBe("Old Car");
    expect(updated!.valueCents).toBe(1500000);

    const logs = assetLogRows().filter((e) => e.action === "update_asset");
    expect(logs).toHaveLength(1);
    expect(logs[0]!.entityId).toBe(id);
  });
});

// ---------------------------------------------------------------------------
// recordValuation
// ---------------------------------------------------------------------------

describe("recordValuation", () => {
  it("appends a valuation and bumps the asset valueCents + lastValuedAt, event_log written", async () => {
    const id = await createAsset(db, {
      name: "ETF Portfolio",
      type: "INVESTMENT",
      valueCents: 5000000,
      institution: null,
      notes: null,
      includeInNetWorth: true,
    });

    const valuedAt = "2026-06-01";
    await recordValuation(db, id, 5250000, valuedAt);

    // Valuation row appended.
    const valuations = await new DrizzleAssetRepo(db).listValuations(id);
    expect(valuations).toHaveLength(1);
    expect(valuations[0]!.valueCents).toBe(5250000);
    expect(valuations[0]!.valuedAt).toBe(valuedAt);

    // Asset row bumped.
    const asset = await new DrizzleAssetRepo(db).getById(id);
    expect(asset!.valueCents).toBe(5250000);
    expect(asset!.lastValuedAt).toBe(valuedAt);

    const logs = assetLogRows().filter((e) => e.action === "record_valuation");
    expect(logs).toHaveLength(1);
    expect(logs[0]!.entityId).toBe(id);
  });
});

// ---------------------------------------------------------------------------
// deleteAsset
// ---------------------------------------------------------------------------

describe("deleteAsset", () => {
  it("removes the asset, event_log written", async () => {
    const id = await createAsset(db, {
      name: "Crypto",
      type: "OTHER",
      valueCents: 300000,
      institution: null,
      notes: null,
      includeInNetWorth: false,
    });

    await deleteAsset(db, id);

    const found = await new DrizzleAssetRepo(db).getById(id);
    expect(found).toBeNull();

    const logs = assetLogRows().filter((e) => e.action === "delete_asset");
    expect(logs).toHaveLength(1);
    expect(logs[0]!.entityId).toBe(id);
  });
});
