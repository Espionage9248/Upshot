import { afterEach, beforeEach, describe, expect, it, test } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDbClient, applyMigrations, tables, DrizzleInstallmentRepo, type DbClient } from "@upshot/db";
import { buildInstallmentFromTransaction, deleteInstallmentPlan } from "./installments-core";

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
// deleteInstallmentPlan
// ---------------------------------------------------------------------------

describe("deleteInstallmentPlan", () => {
  it("removes the plan and writes an event_log entry", async () => {
    const repo = new DrizzleInstallmentRepo(db);
    const id = await repo.create({
      merchant: "Laybuy",
      totalCents: 6000,
      installmentCents: 1000,
      totalInstallments: 6,
      installmentsPaid: 0,
      frequencyDays: 7,
      firstDueDate: "2026-06-20",
      nextDueDate: "2026-06-20",
      status: "ACTIVE",
      matchRuleId: null,
      notes: null,
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
