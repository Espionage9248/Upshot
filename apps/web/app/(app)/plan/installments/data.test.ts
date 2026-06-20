import { afterEach, describe, it, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createDbClient,
  applyMigrations,
  DrizzleInstallmentRepo,
  type DbClient,
} from "@upshot/db";
import { loadInstallmentsData } from "./data";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function freshDb(): DbClient {
  const dir = mkdtempSync(join(tmpdir(), "upshot-installments-data-"));
  dirs.push(dir);
  const { db } = createDbClient({ url: join(dir, "x.db"), key: KEY });
  applyMigrations(db as DbClient);
  return db as DbClient;
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

describe("loadInstallmentsData", () => {
  it("returns empty active and complete when no plans exist", async () => {
    const db = freshDb();
    const result = await loadInstallmentsData(db);

    expect(result.active).toHaveLength(0);
    expect(result.complete).toHaveLength(0);
  });

  it("returns an active plan with computed progress", async () => {
    const db = freshDb();
    const repo = new DrizzleInstallmentRepo(db);
    await repo.create({
      id: "plan-afterpay",
      merchant: "Afterpay",
      totalCents: 20000,
      installmentCents: 5000,
      totalInstallments: 4,
      installmentsPaid: 1,
      frequencyDays: 14,
      firstDueDate: "2026-06-01",
      nextDueDate: "2026-06-15",
      status: "ACTIVE",
      matchRuleId: null,
      notes: null,
    });

    const result = await loadInstallmentsData(db);

    expect(result.active).toHaveLength(1);
    expect(result.complete).toHaveLength(0);
    expect(result.active[0]!.row.id).toBe("plan-afterpay");
    expect(result.active[0]!.row.merchant).toBe("Afterpay");
    // 1 of 4 paid → 25%
    expect(result.active[0]!.progress.percentComplete).toBe(25);
    // 3 remaining installments × 5000 = 15000
    expect(result.active[0]!.progress.remainingCents).toBe(15000);
  });

  it("classifies COMPLETE plans in the complete bucket", async () => {
    const db = freshDb();
    const repo = new DrizzleInstallmentRepo(db);
    await repo.create({
      id: "plan-zip",
      merchant: "Zip",
      totalCents: 30000,
      installmentCents: 7500,
      totalInstallments: 4,
      installmentsPaid: 4,
      frequencyDays: 14,
      firstDueDate: "2026-04-01",
      nextDueDate: "2026-06-10",
      status: "COMPLETE",
      matchRuleId: null,
      notes: null,
    });

    const result = await loadInstallmentsData(db);

    expect(result.active).toHaveLength(0);
    expect(result.complete).toHaveLength(1);
    expect(result.complete[0]!.id).toBe("plan-zip");
  });

  it("separates active and complete plans correctly", async () => {
    const db = freshDb();
    const repo = new DrizzleInstallmentRepo(db);

    await repo.create({
      id: "plan-active",
      merchant: "Klarna",
      totalCents: 10000,
      installmentCents: 2500,
      totalInstallments: 4,
      installmentsPaid: 2,
      frequencyDays: 14,
      firstDueDate: "2026-06-01",
      nextDueDate: "2026-06-29",
      status: "ACTIVE",
      matchRuleId: null,
      notes: null,
    });

    await repo.create({
      id: "plan-done",
      merchant: "Laybuy",
      totalCents: 6000,
      installmentCents: 1000,
      totalInstallments: 6,
      installmentsPaid: 6,
      frequencyDays: 7,
      firstDueDate: "2026-04-01",
      nextDueDate: "2026-05-12",
      status: "COMPLETE",
      matchRuleId: null,
      notes: null,
    });

    const result = await loadInstallmentsData(db);

    expect(result.active).toHaveLength(1);
    expect(result.complete).toHaveLength(1);
    expect(result.active[0]!.row.id).toBe("plan-active");
    expect(result.complete[0]!.id).toBe("plan-done");
    // 2 of 4 paid → 50%
    expect(result.active[0]!.progress.percentComplete).toBe(50);
    expect(result.active[0]!.progress.remainingCents).toBe(5000);
  });

  it("never leaks the encryption key in the returned data", async () => {
    const db = freshDb();
    const result = await loadInstallmentsData(db);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(KEY);
    expect(serialized).not.toContain("DB_ENCRYPTION_KEY");
  });
});
