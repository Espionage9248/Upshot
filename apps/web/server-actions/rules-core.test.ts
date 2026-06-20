import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import {
  createDbClient,
  applyMigrations,
  tables,
  DrizzleMatchRuleRepo,
  type DbClient,
} from "@upshot/db";
import type { UpClientPort, LoadedRule } from "@upshot/core";
import { UpAuthError } from "@upshot/core";
import {
  listRules,
  saveRule,
  deleteRule,
  previewRule,
  applyRule,
} from "./rules-core";
import { updateTaxSettings } from "./settings-core";

// 32 hex chars — matches the encrypted-DB key contract.
const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function tempDbPath(): string {
  const dir = mkdtempSync(join(tmpdir(), "upshot-rules-"));
  dirs.push(dir);
  return join(dir, "test.db");
}

let db: DbClient;

async function seedAccount(accountId = "acct1"): Promise<void> {
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
}

async function seedTransaction(txId: string, description: string): Promise<void> {
  await seedAccount();
  await db.insert(tables.transactions).values({
    id: txId,
    accountId: "acct1",
    status: "SETTLED",
    description,
    amountCents: -1000,
    currency: "AUD",
    createdAt: new Date().toISOString(),
  });
}

async function seedCategory(id: string, name: string): Promise<void> {
  await db.insert(tables.categories).values({ id, name });
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

type ActionSpec = { id: string; type: string; targetId?: string | null; value?: string | null };

/** Build a LoadedRule that matches transactions whose description contains `value`. */
function makeRule(ruleId: string, value: string, actions: ActionSpec[]): LoadedRule {
  return {
    rule: { id: ruleId, name: `Rule ${ruleId}`, isActive: true, priority: 0 },
    conditions: [
      {
        id: `${ruleId}-c1`,
        ruleId,
        field: "description",
        mode: "contains",
        value,
        amountCents: null,
        toleranceCents: null,
        currency: null,
      },
    ],
    actions: actions.map((a) => ({
      id: a.id,
      ruleId,
      type: a.type as never,
      value: a.value ?? null,
      targetId: a.targetId ?? null,
    })),
  };
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
// saveRule
// ---------------------------------------------------------------------------

describe("saveRule", () => {
  it("rejects an unknown SET_CATEGORY target and writes NO rule row", async () => {
    const rule = makeRule("r1", "coffee", [
      { id: "a1", type: "SET_CATEGORY", targetId: "missing-cat" },
    ]);

    const result = await saveRule(db, rule);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.badCategoryId).toBe("missing-cat");

    // No rule row persisted.
    const all = await listRules(db);
    expect(all).toHaveLength(0);
  });

  it("accepts a known SET_CATEGORY target and persists the rule + children", async () => {
    await seedCategory("cat1", "Groceries");
    const rule = makeRule("r2", "woolworths", [
      { id: "a2", type: "SET_CATEGORY", targetId: "cat1" },
    ]);

    const result = await saveRule(db, rule);
    expect(result.ok).toBe(true);

    const loaded = await new DrizzleMatchRuleRepo(db).getById("r2");
    expect(loaded).not.toBeNull();
    expect(loaded!.rule.name).toBe("Rule r2");
    expect(loaded!.conditions).toHaveLength(1);
    expect(loaded!.actions).toHaveLength(1);
    expect(loaded!.actions[0]!.targetId).toBe("cat1");
  });

  it("updates an existing rule on a second save", async () => {
    await seedCategory("cat1", "Groceries");
    const rule = makeRule("r3", "aldi", [{ id: "a3", type: "SET_CATEGORY", targetId: "cat1" }]);
    await saveRule(db, rule);

    const updated: LoadedRule = {
      ...rule,
      rule: { ...rule.rule, name: "Renamed" },
    };
    const result = await saveRule(db, updated);
    expect(result.ok).toBe(true);

    const all = await listRules(db);
    expect(all).toHaveLength(1);
    expect(all[0]!.rule.name).toBe("Renamed");
  });
});

// ---------------------------------------------------------------------------
// deleteRule
// ---------------------------------------------------------------------------

describe("deleteRule", () => {
  it("removes the rule", async () => {
    await seedCategory("cat1", "Groceries");
    const rule = makeRule("r4", "x", [{ id: "a4", type: "MARK_SALARY" }]);
    await saveRule(db, rule);
    expect(await listRules(db)).toHaveLength(1);

    await deleteRule(db, "r4");
    expect(await listRules(db)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// previewRule
// ---------------------------------------------------------------------------

describe("previewRule", () => {
  it("returns the count of matching transactions", async () => {
    await seedTransaction("t1", "COFFEE SHOP");
    await seedTransaction("t2", "coffee beans");
    await seedTransaction("t3", "groceries");

    const rule = makeRule("r5", "coffee", [{ id: "a5", type: "MARK_SALARY" }]);
    const { count } = await previewRule(db, rule);
    // "contains" is case-insensitive: "COFFEE SHOP" + "coffee beans" match, "groceries" does not.
    expect(count).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// applyRule
// ---------------------------------------------------------------------------

describe("applyRule", () => {
  it("persists planned patches locally and pushes via the fake Up", async () => {
    await seedCategory("cat1", "Groceries");
    await seedTransaction("t10", "woolworths metro");
    await seedTag("tag-a");

    const rule = makeRule("r6", "woolworths", [
      { id: "a6", type: "SET_CATEGORY", targetId: "cat1" },
      { id: "a7", type: "APPLY_TAG", targetId: "tag-a" },
      { id: "a8", type: "MARK_TRANSFER" },
    ]);
    await saveRule(db, rule);

    const { fake, pushLog } = makeFakeUp();
    const result = await applyRule(db, fake, "r6");

    expect(result.applied).toBe(1);
    expect(result.warning).toBeUndefined();

    // Local columns changed.
    const row = txRow("t10")!;
    expect(row.categoryId).toBe("cat1");
    expect(row.isTransfer).toBe(true);

    // Tag row inserted.
    const tags = txTagRows("t10");
    expect(tags.map((t) => t.tagId)).toEqual(["tag-a"]);

    // Pushed to Up.
    expect(pushLog.some((l) => l.method === "setCategory")).toBe(true);
    expect(pushLog.some((l) => l.method === "addTag")).toBe(true);
  });

  it("survives a push failure: local write kept, event_log written, warning returned, never rolled back", async () => {
    await seedCategory("cat1", "Groceries");
    await seedTransaction("t11", "woolworths");

    const rule = makeRule("r7", "woolworths", [
      { id: "a9", type: "SET_CATEGORY", targetId: "cat1" },
    ]);
    await saveRule(db, rule);

    const authErr = new UpAuthError(401, "/categories/relationships");
    const { fake } = makeFakeUp({ throwOnSetCategory: authErr });
    const result = await applyRule(db, fake, "r7");

    expect(result.applied).toBe(1);
    // Local write survived.
    expect(txRow("t11")!.categoryId).toBe("cat1");
    // event_log captured the failure.
    const failEvent = eventLogRows().find((e) => e.action === "up_writeback_failed");
    expect(failEvent).toBeDefined();
    expect(failEvent!.entityId).toBe("t11");
    // Warning carried.
    expect(result.warning).toBeDefined();
    expect(result.warning!.code).toBeTypeOf("string");
  });

  it("up=null still persists locally with no warning", async () => {
    await seedCategory("cat1", "Groceries");
    await seedTransaction("t12", "woolworths");

    const rule = makeRule("r8", "woolworths", [
      { id: "a10", type: "SET_CATEGORY", targetId: "cat1" },
    ]);
    await saveRule(db, rule);

    const result = await applyRule(db, null, "r8");
    expect(result.applied).toBe(1);
    expect(result.warning).toBeUndefined();
    expect(txRow("t12")!.categoryId).toBe("cat1");
  });

  it("returns { applied: 0 } for a missing rule id", async () => {
    const result = await applyRule(db, null, "does-not-exist");
    expect(result.applied).toBe(0);
  });

  it("a local-only rule apply writes an apply_rule event_log row", async () => {
    await seedTransaction("t13", "payroll direct credit");
    const rule = makeRule("r9", "payroll", [{ id: "a11", type: "MARK_TRANSFER" }]);
    await saveRule(db, rule);

    const result = await applyRule(db, null, "r9");
    expect(result.applied).toBe(1);
    expect(txRow("t13")!.isTransfer).toBe(true);
    expect(
      eventLogRows().some((e) => e.action === "apply_rule" && e.entityId === "t13"),
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// updateTaxSettings
// ---------------------------------------------------------------------------

describe("updateTaxSettings", () => {
  it("round-trips financialYearStartMonth + medicareLevyApplies", async () => {
    const out = await updateTaxSettings(db, {
      financialYearStartMonth: 7,
      medicareLevyApplies: false,
    });
    expect(out.financialYearStartMonth).toBe(7);
    expect(out.medicareLevyApplies).toBe(false);

    const row = db.select().from(tables.appSettings).where(eq(tables.appSettings.id, "default")).get();
    expect(row!.financialYearStartMonth).toBe(7);
    expect(row!.medicareLevyApplies).toBe(false);
  });

  it("rejects an out-of-range month", async () => {
    await expect(
      updateTaxSettings(db, { financialYearStartMonth: 13, medicareLevyApplies: true }),
    ).rejects.toThrow();
    await expect(
      updateTaxSettings(db, { financialYearStartMonth: 0, medicareLevyApplies: true }),
    ).rejects.toThrow();
  });
});
