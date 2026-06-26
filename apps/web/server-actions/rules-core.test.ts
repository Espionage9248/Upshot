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
  DrizzleRecurringRepo,
  DrizzleDebtRepo,
  DrizzleInstallmentRepo,
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
// saveRule — LINK_* entity FK reconciliation (Step 2)
// ---------------------------------------------------------------------------

async function seedRecurring(id: string): Promise<void> {
  await new DrizzleRecurringRepo(db).create({
    id,
    name: "Patreon",
    kind: "SUBSCRIPTION",
    amountCents: 500,
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
}

async function seedDebt(id: string): Promise<void> {
  await new DrizzleDebtRepo(db).create({
    id,
    name: "Zip Pay",
    type: "BNPL",
    currentBalanceCents: 10000,
    originalBalanceCents: null,
    creditLimitCents: null,
    monthlyPaymentCents: 0,
    minimumPaymentCents: null,
    interestRate: null,
    monthlyFeeCents: null,
    feeDueDay: null,
    payoffPriority: 1,
    includeInSnowball: false,
    includeInNetWorth: true,
    matchRuleId: null,
    accountNumber: null,
    institutionName: null,
    notes: null,
  });
}

async function seedInstallment(id: string): Promise<void> {
  await new DrizzleInstallmentRepo(db).create({
    id,
    merchant: "Afterpay",
    totalCents: 40000,
    installmentCents: 10000,
    totalInstallments: 4,
    frequencyDays: 14,
    firstDueDate: "2026-01-01",
    matchRuleId: null,
    notes: null,
  });
}

describe("saveRule LINK_* FK reconciliation", () => {
  it("2.1: LINK_RECURRING sets the recurring item's matchRuleId", async () => {
    await seedRecurring("rec-1");
    const rule = makeRule("r-link-rec", "patreon", [
      { id: "a-lr1", type: "LINK_RECURRING", targetId: "rec-1" },
    ]);

    await saveRule(db, rule);

    const item = await new DrizzleRecurringRepo(db).getById("rec-1");
    expect(item?.matchRuleId).toBe("r-link-rec");
  });

  it("2.2: re-save with LINK_RECURRING removed clears the item's matchRuleId", async () => {
    await seedRecurring("rec-2");
    const rule = makeRule("r-link-rec2", "patreon", [
      { id: "a-lr2", type: "LINK_RECURRING", targetId: "rec-2" },
    ]);
    await saveRule(db, rule);
    expect((await new DrizzleRecurringRepo(db).getById("rec-2"))?.matchRuleId).toBe("r-link-rec2");

    // Save again without the LINK_RECURRING action
    const updated: LoadedRule = { ...rule, actions: [] };
    await saveRule(db, updated);

    expect((await new DrizzleRecurringRepo(db).getById("rec-2"))?.matchRuleId).toBeNull();
  });

  it("2.3: re-target — linking recA then recB unlinks recA and links recB", async () => {
    await seedRecurring("rec-a");
    await seedRecurring("rec-b");
    const ruleWithA = makeRule("r-retarget", "patreon", [
      { id: "a-rta", type: "LINK_RECURRING", targetId: "rec-a" },
    ]);
    await saveRule(db, ruleWithA);
    expect((await new DrizzleRecurringRepo(db).getById("rec-a"))?.matchRuleId).toBe("r-retarget");

    const ruleWithB: LoadedRule = {
      ...ruleWithA,
      actions: [{ id: "a-rtb", ruleId: "r-retarget", type: "LINK_RECURRING" as never, value: null, targetId: "rec-b" }],
    };
    await saveRule(db, ruleWithB);

    expect((await new DrizzleRecurringRepo(db).getById("rec-a"))?.matchRuleId).toBeNull();
    expect((await new DrizzleRecurringRepo(db).getById("rec-b"))?.matchRuleId).toBe("r-retarget");
  });

  it("2.4a: LINK_DEBT sets the debt's matchRuleId", async () => {
    await seedDebt("debt-link-1");
    const rule = makeRule("r-link-debt", "zip", [
      { id: "a-ld1", type: "LINK_DEBT", targetId: "debt-link-1" },
    ]);
    await saveRule(db, rule);

    const debt = await new DrizzleDebtRepo(db).getById("debt-link-1");
    expect(debt?.matchRuleId).toBe("r-link-debt");
  });

  it("2.4a-2: LINK_DEBT stamps paymentsLinkedAt; dropping the action nulls it", async () => {
    await seedDebt("debt-stamp-1");
    const linked = makeRule("r-stamp", "zip", [
      { id: "a-stamp", type: "LINK_DEBT", targetId: "debt-stamp-1" },
    ]);
    await saveRule(db, linked, () => new Date("2026-06-25T00:00:00Z"));

    const repo = new DrizzleDebtRepo(db);
    let debt = await repo.getById("debt-stamp-1");
    expect(debt?.matchRuleId).toBe("r-stamp");
    expect(debt?.paymentsLinkedAt).toBe("2026-06-25");

    // Re-save the SAME rule id with no LINK_DEBT action → debt unlinked + stamp nulled.
    const unlinked = makeRule("r-stamp", "zip", [
      { id: "a-stamp-2", type: "RENAME", value: "Zip payment" },
    ]);
    await saveRule(db, unlinked, () => new Date("2026-07-01T00:00:00Z"));
    debt = await repo.getById("debt-stamp-1");
    expect(debt?.matchRuleId).toBeNull();
    expect(debt?.paymentsLinkedAt).toBeNull();
  });

  it("2.4b: LINK_INSTALLMENT sets the installment plan's matchRuleId", async () => {
    await seedInstallment("plan-link-1");
    const rule = makeRule("r-link-inst", "afterpay", [
      { id: "a-li1", type: "LINK_INSTALLMENT", targetId: "plan-link-1" },
    ]);
    await saveRule(db, rule);

    const plan = await new DrizzleInstallmentRepo(db).getById("plan-link-1");
    expect(plan?.matchRuleId).toBe("r-link-inst");
  });

  it("2.5: end-to-end — after saveRule with LINK_RECURRING, listActiveWithRule returns the item with conditions", async () => {
    await seedRecurring("rec-e2e");
    const rule = makeRule("r-e2e", "patreon", [
      { id: "a-e2e", type: "LINK_RECURRING", targetId: "rec-e2e" },
    ]);
    await saveRule(db, rule);

    const results = await new DrizzleRecurringRepo(db).listActiveWithRule();
    const found = results.find((r) => r.item.id === "rec-e2e");
    expect(found).toBeDefined();
    expect(found?.item.matchRuleId).toBe("r-e2e");
    expect(found?.conditions).toHaveLength(1);
    expect(found?.conditions[0]?.field).toBe("description");
  });

  it("2.6: regression — debt-form rule FK not cleared when rule is updated without LINK_DEBT action", async () => {
    // Simulate what the debt form does: create a rule row + set debt.matchRuleId directly,
    // with NO LINK_DEBT action in the rule.
    await db.insert(tables.matchRules).values({
      id: "rule-debtform",
      name: "Debt form rule",
      isActive: true,
      priority: 0,
    });
    await seedDebt("debt-form-1");
    // Set the FK directly (no LINK_DEBT action), simulating upsertDebtPaymentRule.
    await new DrizzleDebtRepo(db).setMatchRule("debt-form-1", "rule-debtform");
    expect((await new DrizzleDebtRepo(db).getById("debt-form-1"))?.matchRuleId).toBe("rule-debtform");

    // Now UPDATE the same rule (e.g. rename it) via saveRule — still no LINK_DEBT action.
    const updatedRule: LoadedRule = {
      rule: { id: "rule-debtform", name: "Debt form rule renamed", isActive: true, priority: 0 },
      conditions: [],
      actions: [],
    };
    await saveRule(db, updatedRule);

    // The debt's matchRuleId MUST NOT be cleared.
    const debt = await new DrizzleDebtRepo(db).getById("debt-form-1");
    expect(debt?.matchRuleId).toBe("rule-debtform");
  });
});

// ---------------------------------------------------------------------------
// deleteRule — clears entity FKs (Step 3)
// ---------------------------------------------------------------------------

describe("deleteRule entity FK clearing", () => {
  it("3.1: deleteRule clears the recurring item's matchRuleId and removes the rule", async () => {
    await seedRecurring("rec-del");
    const rule = makeRule("r-del", "patreon", [
      { id: "a-del", type: "LINK_RECURRING", targetId: "rec-del" },
    ]);
    await saveRule(db, rule);
    expect((await new DrizzleRecurringRepo(db).getById("rec-del"))?.matchRuleId).toBe("r-del");

    await deleteRule(db, "r-del");

    expect((await new DrizzleRecurringRepo(db).getById("rec-del"))?.matchRuleId).toBeNull();
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
