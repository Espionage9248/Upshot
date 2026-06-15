import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { createDbClient, type DbClient } from "./client";
import { applyMigrations } from "./migrate";
import { user, session, passkey } from "./schema/auth";

const KEY = "0123456789abcdef0123456789abcdef";
let dir: string;
let db: DbClient;
let raw: { close(): void };

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "upshot-auth-"));
  const client = createDbClient({ url: join(dir, "auth.db"), key: KEY });
  db = client.db;
  raw = client.raw;
  applyMigrations(db);
});

afterEach(() => {
  raw.close();
  rmSync(dir, { recursive: true, force: true });
});

describe("better-auth migration on an encrypted DB", () => {
  it("creates the five auth tables", () => {
    const names = (db.all(
      "SELECT name FROM sqlite_master WHERE type='table'",
    ) as { name: string }[]).map((r) => r.name);
    for (const t of ["user", "session", "account", "verification", "passkey"]) {
      expect(names).toContain(t);
    }
  });

  it("round-trips a user with Date timestamps (the type better-auth writes)", () => {
    const now = new Date("2026-06-14T00:00:00.000Z");
    db.insert(user).values({
      id: "u-1", name: "Owner", email: "owner@example.com", emailVerified: true,
      createdAt: now, updatedAt: now,
    }).run();
    const got = db.select().from(user).where(eq(user.id, "u-1")).get();
    expect(got?.email).toBe("owner@example.com");
    expect(got?.emailVerified).toBe(true);
    expect(got?.createdAt).toBeInstanceOf(Date);
    expect(got?.createdAt?.toISOString()).toBe(now.toISOString());
  });

  it("cascades sessions and passkeys when the user is deleted", () => {
    const now = new Date("2026-06-14T00:00:00.000Z");
    db.insert(user).values({
      id: "u-2", name: "Owner", email: "o2@example.com", createdAt: now, updatedAt: now,
    }).run();
    db.insert(session).values({
      id: "s-1", userId: "u-2", token: "tok", expiresAt: now, createdAt: now, updatedAt: now,
    }).run();
    db.insert(passkey).values({
      id: "pk-1", userId: "u-2", publicKey: "pub", credentialID: "cred",
      counter: 0, deviceType: "platform", backedUp: false,
    }).run();
    expect(db.select().from(session).all()).toHaveLength(1); // guard against vacuous pass
    db.delete(user).where(eq(user.id, "u-2")).run();
    expect(db.select().from(session).all()).toHaveLength(0);
    expect(db.select().from(passkey).all()).toHaveLength(0);
  });
});
