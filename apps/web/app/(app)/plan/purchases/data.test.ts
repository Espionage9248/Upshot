import { afterEach, describe, it, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createDbClient,
  applyMigrations,
  DrizzlePurchaseRepo,
  type DbClient,
} from "@upshot/db";
import { loadPurchasesData } from "./data";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function freshDb(): DbClient {
  const dir = mkdtempSync(join(tmpdir(), "upshot-purchases-data-"));
  dirs.push(dir);
  const { db } = createDbClient({ url: join(dir, "x.db"), key: KEY });
  applyMigrations(db as DbClient);
  return db as DbClient;
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

// now = 2026-06-20, targetDate = 2026-12-20 → monthsUntil = 6
// monthlySaveTarget(120000, "2026-12-20", now) = ceil(120000 / 6) = 20000
const NOW = new Date("2026-06-20T10:00:00.000Z");

describe("loadPurchasesData", () => {
  it("splits rows by status and computes saveMonthlyCents for wishlist", async () => {
    const db = freshDb();
    const repo = new DrizzlePurchaseRepo(db);

    await repo.create({
      id: "wish-1",
      status: "WISHLIST",
      customName: "Sony Headphones",
      targetPriceCents: 120000,
      targetDate: "2026-12-20",
      currency: "AUD",
    });

    await repo.create({
      id: "purch-1",
      status: "PURCHASED",
      customName: "Bought Thing",
      priceCents: 5000,
      purchaseDate: "2026-06-01",
      currency: "AUD",
    });

    const result = await loadPurchasesData(db, NOW);

    expect(result.wishlist).toHaveLength(1);
    expect(result.wishlist[0]!.id).toBe("wish-1");
    expect(result.wishlist[0]!.saveMonthlyCents).toBe(20000);

    expect(result.purchased).toHaveLength(1);
    expect(result.purchased[0]!.id).toBe("purch-1");
  });

  it("returns null saveMonthlyCents when targetDate is null", async () => {
    const db = freshDb();
    const repo = new DrizzlePurchaseRepo(db);

    await repo.create({
      id: "wish-2",
      status: "WISHLIST",
      customName: "No Date Item",
      targetPriceCents: 50000,
      targetDate: null,
      currency: "AUD",
    });

    const result = await loadPurchasesData(db, NOW);

    expect(result.wishlist[0]!.saveMonthlyCents).toBeNull();
  });
});
