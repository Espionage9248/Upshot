import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { and, eq } from "drizzle-orm";
import {
  createDbClient,
  applyMigrations,
  tables,
  type DbClient,
} from "@upshot/db";
import { setAllocation, transferAllocation } from "./budget-core";

// 32 hex chars — matches the encrypted-DB key contract used elsewhere.
const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function tempDbPath(): string {
  const dir = mkdtempSync(join(tmpdir(), "upshot-budget-"));
  dirs.push(dir);
  return join(dir, "test.db");
}

const MONTH = "2026-06";

let db: DbClient;

async function seedAccount(id: string, allocation = 0): Promise<void> {
  await db.insert(tables.accounts).values({
    id,
    name: `Acct ${id}`,
    type: "TRANSACTIONAL",
    ownership: "INDIVIDUAL",
    balanceCents: 0,
    role: "SPENDING",
    monthlyAllocationCents: allocation,
  });
}

function allocationRow(accountId: string) {
  return db
    .select()
    .from(tables.budgetAllocations)
    .where(
      and(
        eq(tables.budgetAllocations.accountId, accountId),
        eq(tables.budgetAllocations.month, MONTH),
      ),
    )
    .get();
}

function accountRow(id: string) {
  return db.select().from(tables.accounts).where(eq(tables.accounts.id, id)).get();
}

function eventLogRows() {
  return db.select().from(tables.eventLog).all();
}

beforeEach(() => {
  const client = createDbClient({ url: tempDbPath(), key: KEY });
  applyMigrations(client.db);
  db = client.db;
});

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

describe("setAllocation", () => {
  it("creates the row with correct variance and updates accounts.monthlyAllocationCents", async () => {
    await seedAccount("a1");

    const res = await setAllocation(db, "a1", MONTH, 50_000);
    expect(res.ok).toBe(true);

    const row = allocationRow("a1");
    expect(row).toBeDefined();
    expect(row!.allocatedCents).toBe(50_000);
    expect(row!.spentCents).toBe(0);
    expect(row!.varianceCents).toBe(50_000);
    expect(row!.year).toBe(2026);

    expect(accountRow("a1")!.monthlyAllocationCents).toBe(50_000);
  });

  it("updates an existing row in place (keyed by accountId+month) and preserves spentCents", async () => {
    await seedAccount("a1");
    await setAllocation(db, "a1", MONTH, 50_000);
    // simulate accrued spend
    await db
      .update(tables.budgetAllocations)
      .set({ spentCents: 20_000, varianceCents: 30_000 })
      .where(eq(tables.budgetAllocations.accountId, "a1"));

    const res = await setAllocation(db, "a1", MONTH, 80_000);
    expect(res.ok).toBe(true);

    const rows = db
      .select()
      .from(tables.budgetAllocations)
      .where(eq(tables.budgetAllocations.accountId, "a1"))
      .all();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.allocatedCents).toBe(80_000);
    expect(rows[0]!.spentCents).toBe(20_000);
    expect(rows[0]!.varianceCents).toBe(60_000);
    expect(accountRow("a1")!.monthlyAllocationCents).toBe(80_000);
  });

  it("writes an event_log row", async () => {
    await seedAccount("a1");
    await setAllocation(db, "a1", MONTH, 50_000);
    const events = eventLogRows();
    expect(events).toHaveLength(1);
    expect(events[0]!.category).toBe("budget");
    expect(events[0]!.action).toBe("allocate");
    expect(events[0]!.entityId).toBe("a1");
  });
});

describe("transferAllocation", () => {
  it("moves cents from one allocation to another, updating both rows + account columns", async () => {
    await seedAccount("from");
    await seedAccount("to");
    await setAllocation(db, "from", MONTH, 50_000);
    await setAllocation(db, "to", MONTH, 10_000);

    const res = await transferAllocation(db, "from", "to", MONTH, 30_000);
    expect(res.ok).toBe(true);

    expect(allocationRow("from")!.allocatedCents).toBe(20_000);
    expect(allocationRow("to")!.allocatedCents).toBe(40_000);
    expect(accountRow("from")!.monthlyAllocationCents).toBe(20_000);
    expect(accountRow("to")!.monthlyAllocationCents).toBe(40_000);
  });

  it("treats a missing destination allocation as zero and creates it", async () => {
    await seedAccount("from");
    await seedAccount("to");
    await setAllocation(db, "from", MONTH, 50_000);

    const res = await transferAllocation(db, "from", "to", MONTH, 30_000);
    expect(res.ok).toBe(true);
    expect(allocationRow("from")!.allocatedCents).toBe(20_000);
    expect(allocationRow("to")!.allocatedCents).toBe(30_000);
  });

  it("REJECTS an overdraw with a typed error and leaves both allocations unchanged", async () => {
    await seedAccount("from");
    await seedAccount("to");
    await setAllocation(db, "from", MONTH, 20_000);
    await setAllocation(db, "to", MONTH, 10_000);

    const res = await transferAllocation(db, "from", "to", MONTH, 30_000);
    expect(res).toEqual({ ok: false, code: "overdraw" });

    // unchanged
    expect(allocationRow("from")!.allocatedCents).toBe(20_000);
    expect(allocationRow("to")!.allocatedCents).toBe(10_000);
    expect(accountRow("from")!.monthlyAllocationCents).toBe(20_000);
    expect(accountRow("to")!.monthlyAllocationCents).toBe(10_000);
  });

  it("writes an event_log row only on success", async () => {
    await seedAccount("from");
    await seedAccount("to");
    await setAllocation(db, "from", MONTH, 50_000);
    await setAllocation(db, "to", MONTH, 0);
    // two allocate events so far
    expect(eventLogRows()).toHaveLength(2);

    await transferAllocation(db, "from", "to", MONTH, 30_000);
    const events = eventLogRows();
    const transfers = events.filter((e) => e.action === "transfer");
    expect(transfers).toHaveLength(1);
    expect(transfers[0]!.category).toBe("budget");
  });
});
