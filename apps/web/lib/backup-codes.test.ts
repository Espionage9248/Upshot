import { describe, expect, it } from "vitest";
import {
  generateBackupCodes,
  hashBackupCode,
  verifyAndConsume,
} from "./backup-codes";

describe("backup codes", () => {
  it("generates 10 unique codes", () => {
    const codes = generateBackupCodes();
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
  });

  it("generates codes from the expected base32 alphabet (~10 chars)", () => {
    const codes = generateBackupCodes();
    for (const code of codes) {
      expect(code).toMatch(/^[0-9A-Z]{10}$/);
    }
  });

  it("a generated code verifies against its own hash", async () => {
    const code = generateBackupCodes()[0]!;
    const hash = await hashBackupCode(code);
    const result = verifyAndConsume(code, [hash]);
    expect(result.ok).toBe(true);
  });

  it("never stores the plaintext code inside its hash", async () => {
    const code = generateBackupCodes()[0]!;
    const hash = await hashBackupCode(code);
    expect(hash).not.toContain(code);
  });

  it("verifying consumes exactly the matched hash", async () => {
    const codes = generateBackupCodes();
    const hashes = await Promise.all(codes.map((c) => hashBackupCode(c)));
    const target = hashes[3]!;

    const result = verifyAndConsume(codes[3]!, hashes);
    expect(result.ok).toBe(true);
    expect(result.remaining).toHaveLength(9);
    expect(result.remaining).not.toContain(target);
    // every other hash is still present
    for (let i = 0; i < hashes.length; i++) {
      if (i !== 3) expect(result.remaining).toContain(hashes[i]!);
    }
  });

  it("a wrong code fails and leaves remaining unchanged", async () => {
    const codes = generateBackupCodes();
    const hashes = await Promise.all(codes.map((c) => hashBackupCode(c)));
    const result = verifyAndConsume("0000000000", hashes);
    expect(result.ok).toBe(false);
    expect(result.remaining).toEqual(hashes);
  });

  it("normalizes input (trim + uppercase) before verifying", async () => {
    const code = generateBackupCodes()[0]!;
    const hash = await hashBackupCode(code);
    const result = verifyAndConsume(`  ${code.toLowerCase()}  `, [hash]);
    expect(result.ok).toBe(true);
  });

  it("two hashes of the same code differ (per-code random salt)", async () => {
    const code = generateBackupCodes()[0]!;
    const a = await hashBackupCode(code);
    const b = await hashBackupCode(code);
    expect(a).not.toBe(b);
  });

  it("fails safe on malformed stored hashes (no throw)", () => {
    const malformed = ["garbage", "scrypt$$", "scrypt$ab$zz", "bcrypt$ab$cd"];
    const result = verifyAndConsume("ABCDEFGHJK", malformed);
    expect(result.ok).toBe(false);
    expect(result.remaining).toEqual(malformed);
  });

  it("returns ok:false on an empty hash list", () => {
    const result = verifyAndConsume("ABCDEFGHJK", []);
    expect(result.ok).toBe(false);
    expect(result.remaining).toEqual([]);
  });
});
