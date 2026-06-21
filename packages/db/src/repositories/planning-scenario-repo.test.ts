import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDbClient, applyMigrations, type DbClient } from "@upshot/db";
import { DrizzlePlanningScenarioRepo, type ScenarioInputs } from "./planning-scenario-repo";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];
let db: DbClient;

beforeEach(() => {
  const dir = mkdtempSync(join(tmpdir(), "upshot-scenarios-"));
  dirs.push(dir);
  const client = createDbClient({ url: join(dir, "x.db"), key: KEY });
  applyMigrations(client.db);
  db = client.db;
});

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

const inputs: ScenarioInputs = {
  mode: "FORWARD",
  baseIncomeCents: 600000,
  raise: { toCents: 700000, fromMonth: "2027-01" },
  discretionaryCents: 80000,
  recurringEdits: [{ id: "r1", keep: true, monthlyCentsOverride: null }],
  toDebtShareBps: 5000,
  strategy: "AVALANCHE",
  lumpSums: [],
  targetMonth: null,
};

describe("DrizzlePlanningScenarioRepo", () => {
  it("creates and lists a scenario with inputs intact", async () => {
    const repo = new DrizzlePlanningScenarioRepo(db);
    const id = await repo.create({ name: "Aggressive", inputs });
    const all = await repo.list();
    expect(all).toHaveLength(1);
    expect(all[0]!.id).toBe(id);
    expect(all[0]!.name).toBe("Aggressive");
    expect(all[0]!.inputs.raise).toEqual({ toCents: 700000, fromMonth: "2027-01" });
  });

  it("getById returns null for a missing id", async () => {
    expect(await new DrizzlePlanningScenarioRepo(db).getById("nope")).toBeNull();
  });

  it("updates name and inputs and bumps updatedAt", async () => {
    const repo = new DrizzlePlanningScenarioRepo(db);
    const id = await repo.create({ name: "A", inputs });
    const before = (await repo.getById(id))!;
    await repo.update(id, { name: "B", inputs: { ...inputs, toDebtShareBps: 10000 } });
    const after = (await repo.getById(id))!;
    expect(after.name).toBe("B");
    expect(after.inputs.toDebtShareBps).toBe(10000);
    expect(after.updatedAt >= before.updatedAt).toBe(true);
  });

  it("deletes a scenario", async () => {
    const repo = new DrizzlePlanningScenarioRepo(db);
    const id = await repo.create({ name: "A", inputs });
    await repo.delete(id);
    expect(await repo.list()).toHaveLength(0);
  });
});
