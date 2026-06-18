import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import {
  createDbClient,
  applyMigrations,
  tables,
  type DbClient,
} from "@upshot/db";
import type { UpClientPort } from "@upshot/core";
import { UpAuthError } from "@upshot/core";
import {
  setCategory,
  setTags,
  markSalary,
  markTransfer,
  markTaxDeductible,
} from "./money-core";

// 32 hex chars — matches the encrypted-DB key contract.
const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function tempDbPath(): string {
  const dir = mkdtempSync(join(tmpdir(), "upshot-money-"));
  dirs.push(dir);
  return join(dir, "test.db");
}

let db: DbClient;

// Seed a minimal account + transaction for use in tests.
async function seedTransaction(txId: string, accountId = "acct1"): Promise<void> {
  // Insert account if not already present.
  const existing = db.select().from(tables.accounts).where(eq(tables.accounts.id, accountId)).get();
  if (!existing) {
    await db.insert(tables.accounts).values({
      id: accountId,
      name: "Test Account",
      type: "TRANSACTIONAL",
      ownership: "INDIVIDUAL",
      balanceCents: 0,
      role: "SPENDING",
    });
  }
  await db.insert(tables.transactions).values({
    id: txId,
    accountId,
    status: "SETTLED",
    description: "Test transaction",
    amountCents: -1000,
    currency: "AUD",
    createdAt: new Date().toISOString(),
  });
}

async function seedTag(tagId: string): Promise<void> {
  await db.insert(tables.tags).values({ id: tagId, createdAt: new Date().toISOString() });
}

function txRow(txId: string) {
  return db.select().from(tables.transactions).where(eq(tables.transactions.id, txId)).get();
}

function eventLogRows() {
  return db.select().from(tables.eventLog).all();
}

function txTagRows(txId: string) {
  return db
    .select()
    .from(tables.transactionTags)
    .where(eq(tables.transactionTags.transactionId, txId))
    .all();
}

/** Build a fake UpClientPort. pushLog records calls; throwOnSetCategory makes setCategory throw. */
function makeFakeUp(opts?: { throwOnSetCategory?: Error; throwOnAddTag?: Error }) {
  const pushLog: { method: string; args: unknown[] }[] = [];
  const fake: UpClientPort = {
    ping: async () => {},
    listAccounts: async () => [],
    listTransactions: async () => [],
    listCategories: async () => [],
    addTag: vi.fn(async (txId: string, tagId: string) => {
      if (opts?.throwOnAddTag) throw opts.throwOnAddTag;
      pushLog.push({ method: "addTag", args: [txId, tagId] });
    }),
    setCategory: vi.fn(async (txId: string, categoryId: string | null) => {
      if (opts?.throwOnSetCategory) throw opts.throwOnSetCategory;
      pushLog.push({ method: "setCategory", args: [txId, categoryId] });
    }),
  };
  return { fake, pushLog };
}

beforeEach(() => {
  const client = createDbClient({ url: tempDbPath(), key: KEY });
  applyMigrations(client.db);
  db = client.db;
});

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// setCategory
// ---------------------------------------------------------------------------

describe("setCategory", () => {
  it("success: updates categoryId locally and calls up.setCategory with correct args", async () => {
    await seedTransaction("tx1");
    // Seed a category.
    await db.insert(tables.categories).values({ id: "cat1", name: "Groceries" });

    const { fake, pushLog } = makeFakeUp();
    await setCategory(db, fake, "tx1", "cat1");

    expect(txRow("tx1")!.categoryId).toBe("cat1");
    expect(pushLog).toHaveLength(1);
    expect(pushLog[0]).toEqual({ method: "setCategory", args: ["tx1", "cat1"] });
  });

  it("success: no warning returned when push succeeds", async () => {
    await seedTransaction("tx2");
    const { fake } = makeFakeUp();
    const result = await setCategory(db, fake, "tx2", null);
    expect(result.warning).toBeUndefined();
  });

  it("push throws UpAuthError: local categoryId STILL updated, event_log has up_writeback_failed, result has warning", async () => {
    await seedTransaction("tx3");
    await db.insert(tables.categories).values({ id: "cat2", name: "Dining" });

    const authErr = new UpAuthError(401, "/categories/relationships");
    const { fake } = makeFakeUp({ throwOnSetCategory: authErr });

    const result = await setCategory(db, fake, "tx3", "cat2");

    // Local write STILL happened.
    expect(txRow("tx3")!.categoryId).toBe("cat2");

    // event_log row written with correct action + entityId.
    const events = eventLogRows();
    const failEvent = events.find((e) => e.action === "up_writeback_failed");
    expect(failEvent).toBeDefined();
    expect(failEvent!.entityId).toBe("tx3");
    expect(failEvent!.entityType).toBe("transaction");

    // meta must NOT contain message, stack, or token.
    const meta = failEvent!.meta as Record<string, unknown>;
    expect(meta).not.toHaveProperty("message");
    expect(meta).not.toHaveProperty("stack");
    expect(JSON.stringify(meta)).not.toContain("UP_API_TOKEN");

    // Safe reason is present.
    expect(meta).toHaveProperty("reason");

    // result carries a warning.
    expect(result.warning).toBeDefined();
    expect(result.warning!.code).toBeTypeOf("string");
    expect(result.warning!.message).toBeTypeOf("string");
  });

  it("up=null: local updated, event_log has up_writeback_skipped, NO warning", async () => {
    await seedTransaction("tx4");
    await db.insert(tables.categories).values({ id: "cat3", name: "Transport" });

    const result = await setCategory(db, null, "tx4", "cat3");

    expect(txRow("tx4")!.categoryId).toBe("cat3");

    const events = eventLogRows();
    const skipEvent = events.find((e) => e.action === "up_writeback_skipped");
    expect(skipEvent).toBeDefined();
    expect(skipEvent!.meta).toMatchObject({ reason: "no_token" });

    // NO warning when token is absent — normal posture.
    expect(result.warning).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// setTags
// ---------------------------------------------------------------------------

describe("setTags", () => {
  it("inserts added tags and deletes removed tags; calls up.addTag for each added tag", async () => {
    await seedTransaction("tx5");
    await seedTag("tag-a");
    await seedTag("tag-b");
    await seedTag("tag-c");
    // Pre-insert tag-b so it can be removed.
    await db.insert(tables.transactionTags).values({ transactionId: "tx5", tagId: "tag-b" });

    const { fake, pushLog } = makeFakeUp();
    await setTags(db, fake, "tx5", ["tag-a", "tag-c"], ["tag-b"]);

    const rows = txTagRows("tx5");
    const tagIds = rows.map((r) => r.tagId).sort();
    expect(tagIds).toEqual(["tag-a", "tag-c"]);

    // addTag called once per added tag.
    const addTagCalls = pushLog.filter((l) => l.method === "addTag");
    expect(addTagCalls).toHaveLength(2);
    const calledTagIds = addTagCalls.map((c) => (c.args as string[])[1]).sort();
    expect(calledTagIds).toEqual(["tag-a", "tag-c"]);
  });

  it("onConflictDoNothing: adding an already-present tag does not error", async () => {
    await seedTransaction("tx6");
    await seedTag("tag-x");
    await db.insert(tables.transactionTags).values({ transactionId: "tx6", tagId: "tag-x" });

    const { fake } = makeFakeUp();
    await expect(setTags(db, fake, "tx6", ["tag-x"], [])).resolves.not.toThrow();
    // Still just one row.
    expect(txTagRows("tx6")).toHaveLength(1);
  });

  it("tag removals are local-only: up.addTag NOT called for removed tags", async () => {
    await seedTransaction("tx7");
    await seedTag("tag-remove");
    await db.insert(tables.transactionTags).values({ transactionId: "tx7", tagId: "tag-remove" });

    const { fake, pushLog } = makeFakeUp();
    await setTags(db, fake, "tx7", [], ["tag-remove"]);

    expect(txTagRows("tx7")).toHaveLength(0);
    // No push calls at all.
    expect(pushLog).toHaveLength(0);
  });

  it("push throws UpAuthError: local tag rows STILL persisted, event_log has up_writeback_failed, result has warning", async () => {
    await seedTransaction("tx13");
    await seedTag("tag-p");
    await seedTag("tag-q");

    const authErr = new UpAuthError(401, "/tags");
    const { fake } = makeFakeUp({ throwOnAddTag: authErr });

    const result = await setTags(db, fake, "tx13", ["tag-p", "tag-q"], []);

    // Both local tag rows still written despite push failure.
    const rows = txTagRows("tx13");
    const tagIds = rows.map((r) => r.tagId).sort();
    expect(tagIds).toEqual(["tag-p", "tag-q"]);

    // event_log row written with correct action + entityId.
    const events = eventLogRows();
    const failEvent = events.find((e) => e.action === "up_writeback_failed");
    expect(failEvent).toBeDefined();
    expect(failEvent!.entityId).toBe("tx13");
    expect(failEvent!.entityType).toBe("transaction");

    // meta must NOT contain message, stack, or token.
    const meta = failEvent!.meta as Record<string, unknown>;
    expect(meta).not.toHaveProperty("message");
    expect(meta).not.toHaveProperty("stack");
    expect(JSON.stringify(meta)).not.toContain("UP_API_TOKEN");

    // Safe reason is present.
    expect(meta).toHaveProperty("reason");

    // result carries a warning.
    expect(result.warning).toBeDefined();
    expect(result.warning!.code).toBeTypeOf("string");
    expect(result.warning!.message).toBeTypeOf("string");
  });

  it("up=null: local tag row persisted, event_log has up_writeback_skipped with { reason: 'no_token' }, NO warning", async () => {
    await seedTransaction("tx14");
    await seedTag("tag-r");

    const result = await setTags(db, null, "tx14", ["tag-r"], []);

    // Local tag row exists.
    expect(txTagRows("tx14")).toHaveLength(1);
    expect(txTagRows("tx14")[0]!.tagId).toBe("tag-r");

    // event_log row with skipped action.
    const events = eventLogRows();
    const skipEvent = events.find((e) => e.action === "up_writeback_skipped");
    expect(skipEvent).toBeDefined();
    expect(skipEvent!.meta).toMatchObject({ reason: "no_token" });

    // NO warning when token is absent — normal posture.
    expect(result.warning).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Local-only actions
// ---------------------------------------------------------------------------

describe("markTaxDeductible", () => {
  it("sets isTaxDeductible + taxDeductionCategory and writes event_log row", async () => {
    await seedTransaction("tx8");

    await markTaxDeductible(db, "tx8", true, "home-office");

    const row = txRow("tx8")!;
    expect(row.isTaxDeductible).toBe(true);
    expect(row.taxDeductionCategory).toBe("home-office");

    const events = eventLogRows();
    expect(events).toHaveLength(1);
    expect(events[0]!.action).toBe("mark_tax_deductible");
    expect(events[0]!.entityId).toBe("tx8");
  });

  it("clears taxDeductionCategory when value is false", async () => {
    await seedTransaction("tx9");
    await markTaxDeductible(db, "tx9", true, "home-office");
    await markTaxDeductible(db, "tx9", false);

    const row = txRow("tx9")!;
    expect(row.isTaxDeductible).toBe(false);
    expect(row.taxDeductionCategory).toBeNull();
  });
});

describe("markSalary", () => {
  it("sets isSalary and writes event_log row", async () => {
    await seedTransaction("tx10");
    await markSalary(db, "tx10", true);

    expect(txRow("tx10")!.isSalary).toBe(true);
    const events = eventLogRows();
    expect(events[0]!.action).toBe("mark_salary");
    expect(events[0]!.entityId).toBe("tx10");
  });
});

describe("markTransfer", () => {
  it("sets isTransfer + transferAccountId and writes event_log row", async () => {
    await seedTransaction("tx11");
    await markTransfer(db, "tx11", true, "acct-savings");

    const row = txRow("tx11")!;
    expect(row.isTransfer).toBe(true);
    expect(row.transferAccountId).toBe("acct-savings");

    const events = eventLogRows();
    expect(events[0]!.action).toBe("mark_transfer");
    expect(events[0]!.entityId).toBe("tx11");
  });

  it("clears transferAccountId when value is false", async () => {
    await seedTransaction("tx12");
    await markTransfer(db, "tx12", true, "acct-savings");
    await markTransfer(db, "tx12", false);

    const row = txRow("tx12")!;
    expect(row.isTransfer).toBe(false);
    expect(row.transferAccountId).toBeNull();
  });
});
