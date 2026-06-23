import { afterEach, describe, it, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createDbClient,
  applyMigrations,
  DrizzleRecurringRepo,
  type DbClient,
} from "@upshot/db";
import { loadRecurringData } from "./data";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function freshDb(): DbClient {
  const dir = mkdtempSync(join(tmpdir(), "upshot-recurring-data-"));
  dirs.push(dir);
  const { db } = createDbClient({ url: join(dir, "x.db"), key: KEY });
  applyMigrations(db as DbClient);
  return db as DbClient;
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

describe("loadRecurringData", () => {
  it("returns empty groups and zero totals when no items exist", async () => {
    const db = freshDb();
    const result = await loadRecurringData(db);

    expect(result.active).toHaveLength(0);
    expect(result.paused).toHaveLength(0);
    expect(result.suggested).toHaveLength(0);
    expect(result.monthlyTotalCents).toBe(0);
    expect(result.overlaps).toHaveLength(0);
    expect(result.driftAlerts).toHaveLength(0);
  });

  it("partitions items by status", async () => {
    const db = freshDb();
    const repo = new DrizzleRecurringRepo(db);

    await repo.create({
      name: "Netflix",
      kind: "SUBSCRIPTION",
      amountCents: 1799,
      frequency: "MONTHLY",
      status: "ACTIVE",
    } as Parameters<typeof repo.create>[0]);

    await repo.create({
      name: "Gym",
      kind: "SUBSCRIPTION",
      amountCents: 6900,
      frequency: "MONTHLY",
      status: "PAUSED",
    } as Parameters<typeof repo.create>[0]);

    await repo.create({
      name: "Spotify",
      kind: "SUBSCRIPTION",
      amountCents: 1199,
      frequency: "MONTHLY",
      status: "SUGGESTED",
    } as Parameters<typeof repo.create>[0]);

    const result = await loadRecurringData(db);

    expect(result.active).toHaveLength(1);
    expect(result.active[0]!.name).toBe("Netflix");
    expect(result.paused).toHaveLength(1);
    expect(result.paused[0]!.name).toBe("Gym");
    expect(result.suggested).toHaveLength(1);
    expect(result.suggested[0]!.name).toBe("Spotify");
  });

  it("excludes CANCELLED items from all groups", async () => {
    const db = freshDb();
    const repo = new DrizzleRecurringRepo(db);

    await repo.create({
      name: "Old Service",
      kind: "SUBSCRIPTION",
      amountCents: 999,
      frequency: "MONTHLY",
      status: "CANCELLED",
    } as Parameters<typeof repo.create>[0]);

    const result = await loadRecurringData(db);

    expect(result.active).toHaveLength(0);
    expect(result.paused).toHaveLength(0);
    expect(result.suggested).toHaveLength(0);
  });

  it("computes monthlyTotalCents over ACTIVE items only", async () => {
    const db = freshDb();
    const repo = new DrizzleRecurringRepo(db);

    // ACTIVE: $10/mo → 1000 cents
    await repo.create({
      name: "Service A",
      kind: "SUBSCRIPTION",
      amountCents: 1000,
      frequency: "MONTHLY",
      status: "ACTIVE",
    } as Parameters<typeof repo.create>[0]);

    // ACTIVE: $120/yr → 1000 cents/mo
    await repo.create({
      name: "Service B",
      kind: "SUBSCRIPTION",
      amountCents: 12000,
      frequency: "YEARLY",
      status: "ACTIVE",
    } as Parameters<typeof repo.create>[0]);

    // PAUSED: should NOT be included in monthly total
    await repo.create({
      name: "Service C",
      kind: "SUBSCRIPTION",
      amountCents: 5000,
      frequency: "MONTHLY",
      status: "PAUSED",
    } as Parameters<typeof repo.create>[0]);

    const result = await loadRecurringData(db);

    // 1000 + round(12000/12) = 1000 + 1000 = 2000
    expect(result.monthlyTotalCents).toBe(2000);
  });

  it("detects overlaps among ACTIVE items by category", async () => {
    const db = freshDb();
    const repo = new DrizzleRecurringRepo(db);

    await repo.create({
      name: "Netflix",
      kind: "SUBSCRIPTION",
      amountCents: 1799,
      frequency: "MONTHLY",
      category: "streaming",
      merchant: null,
      status: "ACTIVE",
    } as Parameters<typeof repo.create>[0]);

    await repo.create({
      name: "Disney+",
      kind: "SUBSCRIPTION",
      amountCents: 1399,
      frequency: "MONTHLY",
      category: "streaming",
      merchant: null,
      status: "ACTIVE",
    } as Parameters<typeof repo.create>[0]);

    const result = await loadRecurringData(db);

    expect(result.overlaps).toHaveLength(1);
    expect(result.overlaps[0]!.groupKey).toBe("category:streaming");
    expect(result.overlaps[0]!.itemIds).toHaveLength(2);
  });

  it("does not detect overlaps for PAUSED or SUGGESTED items", async () => {
    const db = freshDb();
    const repo = new DrizzleRecurringRepo(db);

    await repo.create({
      name: "Netflix",
      kind: "SUBSCRIPTION",
      amountCents: 1799,
      frequency: "MONTHLY",
      category: "streaming",
      merchant: null,
      status: "ACTIVE",
    } as Parameters<typeof repo.create>[0]);

    await repo.create({
      name: "Disney+",
      kind: "SUBSCRIPTION",
      amountCents: 1399,
      frequency: "MONTHLY",
      category: "streaming",
      merchant: null,
      status: "PAUSED",
    } as Parameters<typeof repo.create>[0]);

    const result = await loadRecurringData(db);

    // Only one ACTIVE item in "streaming" — no overlap
    expect(result.overlaps).toHaveLength(0);
  });

  it("surfaces drift alerts for ACTIVE items with price changes", async () => {
    const db = freshDb();
    const repo = new DrizzleRecurringRepo(db);

    const id = await repo.create({
      name: "Netflix",
      kind: "SUBSCRIPTION",
      amountCents: 1799,
      frequency: "MONTHLY",
      status: "ACTIVE",
    } as Parameters<typeof repo.create>[0]);

    // Simulate a price change: previously 1499, now 1799
    await repo.applyDrift(id, 1799, 1499, "2026-06-01");

    const result = await loadRecurringData(db);

    expect(result.driftAlerts).toHaveLength(1);
    expect(result.driftAlerts[0]!.id).toBe(id);
    expect(result.driftAlerts[0]!.name).toBe("Netflix");
    expect(result.driftAlerts[0]!.previousAmountCents).toBe(1499);
    expect(result.driftAlerts[0]!.amountCents).toBe(1799);
  });

  it("does not surface drift alert when lastAmountCents equals amountCents", async () => {
    const db = freshDb();
    const repo = new DrizzleRecurringRepo(db);

    const id = await repo.create({
      name: "Netflix",
      kind: "SUBSCRIPTION",
      amountCents: 1799,
      frequency: "MONTHLY",
      status: "ACTIVE",
    } as Parameters<typeof repo.create>[0]);

    // Same amount — no real drift
    await repo.applyDrift(id, 1799, 1799, "2026-06-01");

    const result = await loadRecurringData(db);

    expect(result.driftAlerts).toHaveLength(0);
  });

  it("does not surface drift alert for PAUSED items", async () => {
    const db = freshDb();
    const repo = new DrizzleRecurringRepo(db);

    const id = await repo.create({
      name: "Gym",
      kind: "SUBSCRIPTION",
      amountCents: 6900,
      frequency: "MONTHLY",
      status: "PAUSED",
    } as Parameters<typeof repo.create>[0]);

    await repo.applyDrift(id, 6900, 5900, "2026-06-01");

    const result = await loadRecurringData(db);

    // Paused items do not appear in driftAlerts
    expect(result.driftAlerts).toHaveLength(0);
  });

  it("never leaks the encryption key in the returned data", async () => {
    const db = freshDb();
    const result = await loadRecurringData(db);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(KEY);
    expect(serialized).not.toContain("DB_ENCRYPTION_KEY");
  });
});
