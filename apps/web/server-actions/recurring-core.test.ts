import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createDbClient,
  applyMigrations,
  DrizzleRecurringRepo,
  tables,
  type DbClient,
} from "@upshot/db";
import { acceptSuggestion, dismissSuggestion, pauseRecurring, setUsage } from "./recurring-core";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function tempDbPath(): string {
  const dir = mkdtempSync(join(tmpdir(), "upshot-recurring-core-"));
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

function recurringEventRows(action: string) {
  return db
    .select()
    .from(tables.eventLog)
    .all()
    .filter((e) => e.category === "recurring" && e.action === action);
}

async function createSuggestion(name = "Spotify"): Promise<string> {
  const repo = new DrizzleRecurringRepo(db);
  return repo.create({
    name,
    kind: "SUBSCRIPTION",
    amountCents: 1199,
    frequency: "MONTHLY",
    status: "SUGGESTED",
  } as Parameters<typeof repo.create>[0]);
}

async function createActive(name = "Netflix"): Promise<string> {
  const repo = new DrizzleRecurringRepo(db);
  return repo.create({
    name,
    kind: "SUBSCRIPTION",
    amountCents: 1799,
    frequency: "MONTHLY",
    status: "ACTIVE",
  } as Parameters<typeof repo.create>[0]);
}

// ---------------------------------------------------------------------------
// acceptSuggestion
// ---------------------------------------------------------------------------

describe("acceptSuggestion", () => {
  it("sets status to ACTIVE and writes an event_log entry", async () => {
    const id = await createSuggestion();

    await acceptSuggestion(db, id);

    const repo = new DrizzleRecurringRepo(db);
    const row = await repo.getById(id);
    expect(row?.status).toBe("ACTIVE");

    const logs = recurringEventRows("accept_suggestion");
    expect(logs).toHaveLength(1);
    expect(logs[0]!.entityId).toBe(id);
    expect(logs[0]!.category).toBe("recurring");
  });

  it("transitions from SUGGESTED to ACTIVE only (status changes)", async () => {
    const id = await createSuggestion("YouTube Premium");

    await acceptSuggestion(db, id);

    const repo = new DrizzleRecurringRepo(db);
    const row = await repo.getById(id);
    expect(row?.status).toBe("ACTIVE");
    expect(row?.name).toBe("YouTube Premium");
  });
});

// ---------------------------------------------------------------------------
// dismissSuggestion
// ---------------------------------------------------------------------------

describe("dismissSuggestion", () => {
  it("sets status to CANCELLED (not delete) and writes an event_log entry", async () => {
    const id = await createSuggestion("Amazon Prime");

    await dismissSuggestion(db, id);

    // Row must still exist (not deleted) — knownPatterns() needs it
    const repo = new DrizzleRecurringRepo(db);
    const row = await repo.getById(id);
    expect(row).not.toBeNull();
    expect(row?.status).toBe("CANCELLED");

    const logs = recurringEventRows("dismiss_suggestion");
    expect(logs).toHaveLength(1);
    expect(logs[0]!.entityId).toBe(id);
  });

  it("dismissed item appears in knownPatterns so detection won't re-suggest it", async () => {
    const id = await createSuggestion("Disney Plus");

    await dismissSuggestion(db, id);

    const repo = new DrizzleRecurringRepo(db);
    const patterns = await repo.knownPatterns();
    expect(patterns.has("disney plus")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// pauseRecurring
// ---------------------------------------------------------------------------

describe("pauseRecurring", () => {
  it("sets status to PAUSED and writes an event_log entry", async () => {
    const id = await createActive("Gym Membership");

    await pauseRecurring(db, id);

    const repo = new DrizzleRecurringRepo(db);
    const row = await repo.getById(id);
    expect(row?.status).toBe("PAUSED");

    const logs = recurringEventRows("pause_recurring");
    expect(logs).toHaveLength(1);
    expect(logs[0]!.entityId).toBe(id);
    expect(logs[0]!.category).toBe("recurring");
  });
});

// ---------------------------------------------------------------------------
// setUsage
// ---------------------------------------------------------------------------

describe("setUsage", () => {
  it("updates usageCount and writes an event_log entry", async () => {
    const id = await createActive("Gym Membership");

    await setUsage(db, id, 8);

    const repo = new DrizzleRecurringRepo(db);
    const row = await repo.getById(id);
    expect(row?.usageCount).toBe(8);

    const logs = recurringEventRows("set_usage");
    expect(logs).toHaveLength(1);
    expect(logs[0]!.entityId).toBe(id);
    const meta = logs[0]!.meta as Record<string, unknown>;
    expect(meta.usageCount).toBe(8);
  });

  it("updates usageResetAt when provided", async () => {
    const id = await createActive("Gym Membership");

    await setUsage(db, id, 0, "2026-07-01");

    const repo = new DrizzleRecurringRepo(db);
    const row = await repo.getById(id);
    expect(row?.usageCount).toBe(0);
    expect(row?.usageResetAt).toBe("2026-07-01");
  });

  it("event_log meta reflects usageCount and usageResetAt", async () => {
    const id = await createActive();

    await setUsage(db, id, 12, "2026-06-30");

    const logs = recurringEventRows("set_usage");
    expect(logs).toHaveLength(1);
    const meta = logs[0]!.meta as Record<string, unknown>;
    expect(meta.usageCount).toBe(12);
    expect(meta.usageResetAt).toBe("2026-06-30");
  });
});
