import { afterEach, beforeEach, describe, expect, it, test } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDbClient, applyMigrations, tables, type DbClient } from "@upshot/db";
import { buildInstallmentFromTransaction, createInstallmentPlan, deleteInstallmentPlan } from "./installments-core";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function tempDbPath(): string {
  const dir = mkdtempSync(join(tmpdir(), "upshot-installments-core-"));
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

function installmentEventRows(action: string) {
  return db
    .select()
    .from(tables.eventLog)
    .all()
    .filter((e) => e.category === "installment" && e.action === action);
}

// ---------------------------------------------------------------------------
// createInstallmentPlan
// ---------------------------------------------------------------------------

describe("createInstallmentPlan", () => {
  it("inserts a plan row and writes an event_log entry", async () => {
    const id = await createInstallmentPlan(db, {
      merchant: "Afterpay",
      totalCents: 20000,
      installmentCents: 5000,
      totalInstallments: 4,
      frequencyDays: 14,
      firstDueDate: "2026-06-20",
    });

    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);

    const rows = db.select().from(tables.installmentPlans).all();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.merchant).toBe("Afterpay");
    expect(rows[0]!.totalCents).toBe(20000);
    expect(rows[0]!.installmentCents).toBe(5000);
    expect(rows[0]!.totalInstallments).toBe(4);
    expect(rows[0]!.installmentsPaid).toBe(0);
    expect(rows[0]!.status).toBe("ACTIVE");

    const logs = installmentEventRows("create_installment_plan");
    expect(logs).toHaveLength(1);
    expect(logs[0]!.entityId).toBe(id);
    expect(logs[0]!.category).toBe("installment");
  });

  it("returns the provided id when one is supplied", async () => {
    const id = await createInstallmentPlan(db, {
      id: "plan-explicit",
      merchant: "Zip",
      totalCents: 30000,
      installmentCents: 7500,
      totalInstallments: 4,
      frequencyDays: 14,
      firstDueDate: "2026-06-20",
    });

    expect(id).toBe("plan-explicit");
  });

  it("defaults installmentsPaid to 0 and status to ACTIVE", async () => {
    await createInstallmentPlan(db, {
      merchant: "Klarna",
      totalCents: 10000,
      installmentCents: 2500,
      totalInstallments: 4,
      frequencyDays: 14,
      firstDueDate: "2026-07-01",
    });

    const row = db.select().from(tables.installmentPlans).all()[0]!;
    expect(row.installmentsPaid).toBe(0);
    expect(row.status).toBe("ACTIVE");
  });
});

// ---------------------------------------------------------------------------
// deleteInstallmentPlan
// ---------------------------------------------------------------------------

describe("deleteInstallmentPlan", () => {
  it("removes the plan and writes an event_log entry", async () => {
    const id = await createInstallmentPlan(db, {
      merchant: "Laybuy",
      totalCents: 6000,
      installmentCents: 1000,
      totalInstallments: 6,
      frequencyDays: 7,
      firstDueDate: "2026-06-20",
    });

    await deleteInstallmentPlan(db, id);

    expect(db.select().from(tables.installmentPlans).all()).toHaveLength(0);

    const logs = installmentEventRows("delete_installment_plan");
    expect(logs).toHaveLength(1);
    expect(logs[0]!.entityId).toBe(id);
  });
});

// ---------------------------------------------------------------------------
// buildInstallmentFromTransaction
// ---------------------------------------------------------------------------

test("Path A: 14-day cadence, derived total, ACTIVE when partly paid", () => {
  const p = buildInstallmentFromTransaction({ txDate: "2026-06-01", merchant: "Afterpay – ACME", installmentCents: 2500, totalInstallments: 4, installmentsPaid: 1 });
  expect(p.frequencyDays).toBe(14);
  expect(p.firstDueDate).toBe("2026-06-01");
  expect(p.nextDueDate).toBe("2026-06-15");          // +1×14
  expect(p.totalCents).toBe(10000);                   // 2500×4
  expect(p.installmentsPaid).toBe(1);
  expect(p.status).toBe("ACTIVE");
});

test("Path A: COMPLETE when installmentsPaid >= totalInstallments", () => {
  const p = buildInstallmentFromTransaction({ txDate: "2026-06-01", merchant: "X", installmentCents: 2500, totalInstallments: 4, installmentsPaid: 4 });
  expect(p.status).toBe("COMPLETE");
});
