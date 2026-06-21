import { afterEach, describe, it, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDbClient, type DbClient } from "../client";
import { applyMigrations } from "../migrate";
import { DrizzlePurchaseRepo } from "./purchase-repo";
import { accounts, transactions } from "../schema";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function freshDb(): DbClient {
  const dir = mkdtempSync(join(tmpdir(), "upshot-purchaserepo-"));
  dirs.push(dir);
  const { db } = createDbClient({ url: join(dir, "x.db"), key: KEY });
  applyMigrations(db as DbClient);
  return db as DbClient;
}

afterEach(() => { while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true }); });

/** Seed an account + transaction to satisfy FK on purchases.transactionId. */
function seedTransaction(db: DbClient, txnId: string): void {
  db.insert(accounts).values({
    id: "acc-seed",
    name: "Spending",
    type: "TRANSACTIONAL",
    ownership: "INDIVIDUAL",
    balanceCents: 0,
    role: "SPENDING",
    monthlyAllocationCents: 0,
    lastSyncedAt: null,
    updatedAt: new Date().toISOString(),
  }).run();
  db.insert(transactions).values({
    id: txnId,
    accountId: "acc-seed",
    status: "SETTLED",
    description: "Test txn",
    amountCents: -5000,
    createdAt: new Date().toISOString(),
  }).run();
}

describe("DrizzlePurchaseRepo", () => {
  it("create→list round-trips all fields", async () => {
    const repo = new DrizzlePurchaseRepo(freshDb());

    const id = await repo.create({
      id: "purchase-1",
      customName: "New headphones",
      status: "WISHLIST",
      transactionId: null,
      priceCents: null,
      currency: "AUD",
      merchant: "JB Hi-Fi",
      category: "Electronics",
      purchaseDate: null,
      targetDate: "2026-12-25",
      targetPriceCents: 29900,
      priority: 1,
      url: "https://example.com",
      notes: "Birthday gift to self",
    });

    expect(id).toBe("purchase-1");

    const list = await repo.list();
    expect(list).toHaveLength(1);
    const got = list[0]!;
    expect(got.id).toBe("purchase-1");
    expect(got.customName).toBe("New headphones");
    expect(got.status).toBe("WISHLIST");
    expect(got.currency).toBe("AUD");
    expect(got.merchant).toBe("JB Hi-Fi");
    expect(got.category).toBe("Electronics");
    expect(got.targetDate).toBe("2026-12-25");
    expect(got.targetPriceCents).toBe(29900);
    expect(got.priority).toBe(1);
    expect(got.url).toBe("https://example.com");
    expect(got.notes).toBe("Birthday gift to self");
  });

  it("create generates id when absent", async () => {
    const repo = new DrizzlePurchaseRepo(freshDb());
    const id = await repo.create({
      status: "WISHLIST",
      currency: "AUD",
    });
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
    const got = await repo.getById(id);
    expect(got).not.toBeNull();
  });

  it("listByStatus filters correctly", async () => {
    const repo = new DrizzlePurchaseRepo(freshDb());

    await repo.create({ id: "w-1", status: "WISHLIST", currency: "AUD", merchant: "Store A" });
    await repo.create({ id: "w-2", status: "WISHLIST", currency: "AUD", merchant: "Store B" });
    await repo.create({ id: "p-1", status: "PURCHASED", currency: "AUD", merchant: "Store C" });

    const wishlist = await repo.listByStatus("WISHLIST");
    expect(wishlist).toHaveLength(2);
    expect(wishlist.map((r) => r.id).sort()).toEqual(["w-1", "w-2"]);

    const purchased = await repo.listByStatus("PURCHASED");
    expect(purchased).toHaveLength(1);
    expect(purchased[0]!.id).toBe("p-1");
  });

  it("getById returns null for unknown id", async () => {
    const repo = new DrizzlePurchaseRepo(freshDb());
    expect(await repo.getById("no-such")).toBeNull();
  });

  it("update persists changes", async () => {
    const repo = new DrizzlePurchaseRepo(freshDb());
    const id = await repo.create({ id: "upd-1", status: "WISHLIST", currency: "AUD", merchant: "Old" });
    const row = await repo.getById(id);
    await repo.update({ ...row!, merchant: "New", notes: "Updated" });
    const after = await repo.getById(id);
    expect(after?.merchant).toBe("New");
    expect(after?.notes).toBe("Updated");
  });

  it("setStatus flips status and sets link fields", async () => {
    const db = freshDb();
    seedTransaction(db, "txn-buy");
    const repo = new DrizzlePurchaseRepo(db);

    const id = await repo.create({ id: "wish-1", status: "WISHLIST", currency: "AUD", merchant: "Kmart" });

    await repo.setStatus(id, "PURCHASED", {
      transactionId: "txn-buy",
      priceCents: 4999,
      purchaseDate: "2026-06-20",
    });

    const got = await repo.getById(id);
    expect(got?.status).toBe("PURCHASED");
    expect(got?.transactionId).toBe("txn-buy");
    expect(got?.priceCents).toBe(4999);
    expect(got?.purchaseDate).toBe("2026-06-20");
  });

  it("delete removes the row", async () => {
    const repo = new DrizzlePurchaseRepo(freshDb());
    const id = await repo.create({ id: "del-1", status: "WISHLIST", currency: "AUD" });
    await repo.delete(id);
    expect(await repo.getById(id)).toBeNull();
    expect(await repo.list()).toHaveLength(0);
  });
});
