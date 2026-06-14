import { afterEach, beforeEach, describe, expect, it } from "vitest";
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
import { generateBackupCodes, hashBackupCode } from "@/lib/backup-codes";
import { redeemBackupCode } from "./redeem-core";

// 32 hex chars — matches the encrypted-DB key contract used elsewhere.
const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function tempDbPath(): string {
  const dir = mkdtempSync(join(tmpdir(), "upshot-redeem-"));
  dirs.push(dir);
  return join(dir, "test.db");
}

const USER_ID = "user-1";

async function storedHashes(db: DbClient): Promise<string[]> {
  const [u] = await db.select().from(tables.user).where(eq(tables.user.id, USER_ID));
  return JSON.parse(u!.backupCodes!) as string[];
}

let db: DbClient;
let codes: string[];

beforeEach(async () => {
  const client = createDbClient({ url: tempDbPath(), key: KEY });
  applyMigrations(client.db);
  db = client.db;

  codes = generateBackupCodes();
  const hashes = await Promise.all(codes.map(hashBackupCode));
  const now = new Date();
  await db.insert(tables.user).values({
    id: USER_ID,
    name: "Owner",
    email: "owner@example.test",
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
    backupCodes: JSON.stringify(hashes),
  });
});

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

describe("redeemBackupCode", () => {
  it("redeems a valid unused code: ok + userId, and consumes exactly one hash", async () => {
    const res = await redeemBackupCode(codes[0]!, db);
    expect(res).toEqual({ ok: true, userId: USER_ID });

    const remaining = await storedHashes(db);
    expect(remaining).toHaveLength(9);
  });

  it("rejects an already-consumed code (reuse) and leaves the set unchanged after the first redeem", async () => {
    const first = await redeemBackupCode(codes[0]!, db);
    expect(first.ok).toBe(true);
    const afterFirst = await storedHashes(db);
    expect(afterFirst).toHaveLength(9);

    const reuse = await redeemBackupCode(codes[0]!, db);
    expect(reuse).toEqual({ ok: false });
    const afterReuse = await storedHashes(db);
    expect(afterReuse).toEqual(afterFirst); // no further consumption
  });

  it("rejects an invalid code and leaves the set unchanged", async () => {
    const before = await storedHashes(db);
    const res = await redeemBackupCode("NOTACODE99", db);
    expect(res).toEqual({ ok: false });
    const after = await storedHashes(db);
    expect(after).toEqual(before);
  });

  it("returns ok:false when no codes are provisioned", async () => {
    await db
      .update(tables.user)
      .set({ backupCodes: null })
      .where(eq(tables.user.id, USER_ID));
    const res = await redeemBackupCode(codes[0]!, db);
    expect(res).toEqual({ ok: false });
  });
});
