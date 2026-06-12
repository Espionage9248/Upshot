import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3-multiple-ciphers";
import { openEncryptedDatabase } from "./encryption";

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function tempDbPath(): string {
  const dir = mkdtempSync(join(tmpdir(), "upshot-enc-"));
  dirs.push(dir);
  return join(dir, "test.db");
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

describe("openEncryptedDatabase", () => {
  it("throws when the key is missing", () => {
    expect(() => openEncryptedDatabase({ url: tempDbPath(), key: "" })).toThrow();
  });

  it("throws when the key is only whitespace", () => {
    expect(() => openEncryptedDatabase({ url: tempDbPath(), key: "   " })).toThrow();
  });

  it("writes an encrypted file that is unreadable without the key", () => {
    const url = tempDbPath();
    const db = openEncryptedDatabase({ url, key: KEY });
    db.exec("CREATE TABLE secret (v TEXT)");
    db.prepare("INSERT INTO secret (v) VALUES (?)").run("hello");
    db.close();

    // Opening the same file as a plain (unkeyed) sqlite DB must fail to read it.
    const plain = new Database(url);
    expect(() => plain.prepare("SELECT v FROM secret").get()).toThrow();
    plain.close();
  });

  it("reads back with the correct key and rejects the wrong key", () => {
    const url = tempDbPath();
    const db = openEncryptedDatabase({ url, key: KEY });
    db.exec("CREATE TABLE secret (v TEXT)");
    db.prepare("INSERT INTO secret (v) VALUES (?)").run("hello");
    db.close();

    const good = openEncryptedDatabase({ url, key: KEY });
    expect(good.prepare("SELECT v AS v FROM secret").get()).toEqual({ v: "hello" });
    expect(good.pragma("journal_mode", { simple: true })).toBe("wal");
    good.close();

    // Wrong key fails fast at open time (decryption validation), not lazily later.
    expect(() => openEncryptedDatabase({ url, key: "ffffffffffffffffffffffffffffffff" })).toThrow();
  });
});
