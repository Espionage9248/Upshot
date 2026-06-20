import { afterEach, describe, it, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDbClient, type DbClient } from "../client";
import { applyMigrations } from "../migrate";
import { DrizzleRecurringRepo } from "./recurring-repo";
import { accounts } from "../schema";
import type { DetectedRecurring } from "@upshot/core";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function freshDb(): DbClient {
  const dir = mkdtempSync(join(tmpdir(), "upshot-recurringrepo-"));
  dirs.push(dir);
  const { db } = createDbClient({ url: join(dir, "x.db"), key: KEY });
  applyMigrations(db as DbClient);
  return db as DbClient;
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

function seedAccount(db: DbClient, id = "acc-1"): void {
  db.insert(accounts).values({
    id,
    name: "Spending",
    type: "TRANSACTIONAL",
    ownership: "INDIVIDUAL",
    balanceCents: 0,
    role: "SPENDING",
    monthlyAllocationCents: 0,
    lastSyncedAt: null,
    updatedAt: new Date().toISOString(),
  }).run();
}

const baseDetected: DetectedRecurring = {
  descriptionPattern: "netflix",
  displayName: "Netflix",
  amountCents: 1799,
  frequency: "MONTHLY",
  category: "Entertainment",
  merchant: "Netflix",
  accountId: "acc-1",
  firstDate: "2026-01-01",
  lastDate: "2026-06-01",
  nextExpectedDate: "2026-07-01",
};

describe("DrizzleRecurringRepo", () => {
  it("CRUD round-trip: create, getById, list, delete", async () => {
    const db = freshDb();
    seedAccount(db);
    const repo = new DrizzleRecurringRepo(db);

    const id = await repo.create({
      id: "rec-1",
      name: "Spotify",
      kind: "SUBSCRIPTION",
      amountCents: 1299,
      frequency: "MONTHLY",
      status: "ACTIVE",
      category: "Entertainment",
      merchant: "Spotify",
      accountId: "acc-1",
      isAutoDetected: true,
      matchRuleId: null,
      notes: null,
      nextExpectedDate: "2026-07-15",
      lastDetectedDate: "2026-06-15",
      firstDetectedDate: "2026-01-15",
    });
    expect(id).toBe("rec-1");

    const got = await repo.getById(id);
    expect(got).not.toBeNull();
    expect(got?.name).toBe("Spotify");
    expect(got?.amountCents).toBe(1299);
    expect(got?.status).toBe("ACTIVE");
    expect(got?.usageCount).toBe(0);
    expect(got?.lastAmountCents).toBeNull();
    expect(got?.priceLastChangedAt).toBeNull();

    // getById unknown
    expect(await repo.getById("no-such")).toBeNull();

    // list
    const list = await repo.list();
    expect(list.map((r) => r.id)).toContain(id);

    // delete
    await repo.delete(id);
    expect(await repo.getById(id)).toBeNull();
  });

  it("listByStatus filters correctly", async () => {
    const repo = new DrizzleRecurringRepo(freshDb());

    await repo.create({
      id: "rec-active",
      name: "Spotify",
      kind: "SUBSCRIPTION",
      amountCents: 1299,
      frequency: "MONTHLY",
      status: "ACTIVE",
      category: null,
      merchant: null,
      accountId: null,
      isAutoDetected: false,
      matchRuleId: null,
      notes: null,
      nextExpectedDate: null,
      lastDetectedDate: null,
      firstDetectedDate: null,
    });
    await repo.create({
      id: "rec-suggested",
      name: "Netflix",
      kind: "SUBSCRIPTION",
      amountCents: 1799,
      frequency: "MONTHLY",
      status: "SUGGESTED",
      category: null,
      merchant: null,
      accountId: null,
      isAutoDetected: true,
      matchRuleId: null,
      notes: null,
      nextExpectedDate: null,
      lastDetectedDate: null,
      firstDetectedDate: null,
    });

    const active = await repo.listByStatus("ACTIVE");
    expect(active.map((r) => r.id)).toEqual(["rec-active"]);

    const suggested = await repo.listByStatus("SUGGESTED");
    expect(suggested.map((r) => r.id)).toEqual(["rec-suggested"]);
  });

  it("upsertSuggestion inserts as SUGGESTED on first call", async () => {
    const db = freshDb();
    seedAccount(db);
    const repo = new DrizzleRecurringRepo(db);

    await repo.upsertSuggestion(baseDetected);

    const list = await repo.listByStatus("SUGGESTED");
    expect(list).toHaveLength(1);
    expect(list[0]?.name).toBe("Netflix");
    expect(list[0]?.amountCents).toBe(1799);
    expect(list[0]?.isAutoDetected).toBe(true);
    expect(list[0]?.firstDetectedDate).toBe("2026-01-01");
    expect(list[0]?.lastDetectedDate).toBe("2026-06-01");
    expect(list[0]?.nextExpectedDate).toBe("2026-07-01");
  });

  it("upsertSuggestion updates existing row (case-insensitive name match)", async () => {
    const db = freshDb();
    seedAccount(db);
    const repo = new DrizzleRecurringRepo(db);

    // First upsert creates the row with displayName "Netflix"
    await repo.upsertSuggestion(baseDetected);

    // Second upsert — same descriptionPattern ("netflix"), different amount and dates
    await repo.upsertSuggestion({
      ...baseDetected,
      displayName: "NETFLIX", // different casing — should still match
      amountCents: 1999,
      lastDate: "2026-07-01",
      nextExpectedDate: "2026-08-01",
    });

    const list = await repo.list();
    // Still only one row
    expect(list).toHaveLength(1);
    expect(list[0]?.amountCents).toBe(1999);
    expect(list[0]?.lastDetectedDate).toBe("2026-07-01");
    expect(list[0]?.nextExpectedDate).toBe("2026-08-01");
  });

  it("upsertSuggestion updates an ACTIVE row (already accepted)", async () => {
    const db = freshDb();
    seedAccount(db);
    const repo = new DrizzleRecurringRepo(db);

    // Insert directly as ACTIVE (user previously accepted)
    await repo.create({
      id: "rec-netflix",
      name: "Netflix",   // name.trim().toLowerCase() = "netflix" = descriptionPattern
      kind: "SUBSCRIPTION",
      amountCents: 1799,
      frequency: "MONTHLY",
      status: "ACTIVE",
      category: "Entertainment",
      merchant: "Netflix",
      accountId: "acc-1",
      isAutoDetected: true,
      matchRuleId: null,
      notes: null,
      nextExpectedDate: "2026-07-01",
      lastDetectedDate: "2026-06-01",
      firstDetectedDate: "2026-01-01",
    });

    // Upsert with updated amount
    await repo.upsertSuggestion({ ...baseDetected, amountCents: 2099 });

    const got = await repo.getById("rec-netflix");
    // Still ACTIVE, amount updated
    expect(got?.status).toBe("ACTIVE");
    expect(got?.amountCents).toBe(2099);
  });

  it("setStatus transitions SUGGESTED -> ACTIVE and ACTIVE -> CANCELLED", async () => {
    const db = freshDb();
    seedAccount(db);
    const repo = new DrizzleRecurringRepo(db);

    await repo.upsertSuggestion(baseDetected);
    const [suggestion] = await repo.listByStatus("SUGGESTED");
    expect(suggestion).toBeDefined();
    const id = suggestion!.id;

    await repo.setStatus(id, "ACTIVE");
    expect((await repo.getById(id))?.status).toBe("ACTIVE");

    await repo.setStatus(id, "CANCELLED");
    expect((await repo.getById(id))?.status).toBe("CANCELLED");
  });

  it("applyDrift persists amount, lastAmount, and changedAt", async () => {
    const repo = new DrizzleRecurringRepo(freshDb());

    const id = await repo.create({
      id: "rec-drift",
      name: "Gym",
      kind: "BILL",
      amountCents: 5000,
      frequency: "MONTHLY",
      status: "ACTIVE",
      category: null,
      merchant: "Gym",
      accountId: null,
      isAutoDetected: false,
      matchRuleId: null,
      notes: null,
      nextExpectedDate: null,
      lastDetectedDate: null,
      firstDetectedDate: null,
    });

    await repo.applyDrift(id, 5500, 5000, "2026-07-01T00:00:00.000Z");

    const got = await repo.getById(id);
    expect(got?.amountCents).toBe(5500);
    expect(got?.lastAmountCents).toBe(5000);
    expect(got?.priceLastChangedAt).toBe("2026-07-01T00:00:00.000Z");
  });

  it("setUsage persists usageCount and usageResetAt", async () => {
    const repo = new DrizzleRecurringRepo(freshDb());

    const id = await repo.create({
      id: "rec-usage",
      name: "Gym",
      kind: "BILL",
      amountCents: 5000,
      frequency: "MONTHLY",
      status: "ACTIVE",
      category: null,
      merchant: null,
      accountId: null,
      isAutoDetected: false,
      matchRuleId: null,
      notes: null,
      nextExpectedDate: null,
      lastDetectedDate: null,
      firstDetectedDate: null,
    });

    await repo.setUsage(id, 12, "2026-07-01");

    const got = await repo.getById(id);
    expect(got?.usageCount).toBe(12);
    expect(got?.usageResetAt).toBe("2026-07-01");

    // reset
    await repo.setUsage(id, 0, null);
    const got2 = await repo.getById(id);
    expect(got2?.usageCount).toBe(0);
    expect(got2?.usageResetAt).toBeNull();
  });

  it("knownPatterns excludes SUGGESTED items and includes ACTIVE, PAUSED, CANCELLED", async () => {
    const db = freshDb();
    seedAccount(db);
    const repo = new DrizzleRecurringRepo(db);

    // SUGGESTED — should NOT appear in knownPatterns
    await repo.upsertSuggestion(baseDetected);

    // ACTIVE — should appear
    await repo.create({
      id: "rec-spotify",
      name: "Spotify",
      kind: "SUBSCRIPTION",
      amountCents: 1299,
      frequency: "MONTHLY",
      status: "ACTIVE",
      category: null,
      merchant: null,
      accountId: null,
      isAutoDetected: false,
      matchRuleId: null,
      notes: null,
      nextExpectedDate: null,
      lastDetectedDate: null,
      firstDetectedDate: null,
    });

    // PAUSED — should appear
    await repo.create({
      id: "rec-gym",
      name: "Gym Membership",
      kind: "BILL",
      amountCents: 4900,
      frequency: "MONTHLY",
      status: "PAUSED",
      category: null,
      merchant: null,
      accountId: null,
      isAutoDetected: false,
      matchRuleId: null,
      notes: null,
      nextExpectedDate: null,
      lastDetectedDate: null,
      firstDetectedDate: null,
    });

    const patterns = await repo.knownPatterns();

    // ACTIVE and PAUSED appear
    expect(patterns.has("spotify")).toBe(true);
    expect(patterns.has("gym membership")).toBe(true);
    // SUGGESTED does NOT appear
    expect(patterns.has("netflix")).toBe(false);
  });

  it("knownPatterns includes CANCELLED item — suppresses re-suggestion of dismissed items", async () => {
    const db = freshDb();
    seedAccount(db);
    const repo = new DrizzleRecurringRepo(db);

    // User dismisses (CANCELLED) the Netflix suggestion
    await repo.upsertSuggestion(baseDetected);
    const [suggestion] = await repo.listByStatus("SUGGESTED");
    await repo.setStatus(suggestion!.id, "CANCELLED");

    const patterns = await repo.knownPatterns();

    // CANCELLED item's pattern MUST appear so C1 detectRecurring skips it
    expect(patterns.has("netflix")).toBe(true);
  });

  it("knownPatterns returns empty set with no non-SUGGESTED items", async () => {
    const db = freshDb();
    seedAccount(db);
    const repo = new DrizzleRecurringRepo(db);

    await repo.upsertSuggestion(baseDetected);
    const patterns = await repo.knownPatterns();
    expect(patterns.size).toBe(0);
  });
});
