import { describe, expect, it } from "vitest";
import { assertValidRpId, isValidRpId } from "./rp-id";

describe("rp-id validation", () => {
  const tailnet = "https://upshot.tailnet.ts.net";

  it("rejects a mismatched rpID (different domain)", () => {
    expect(isValidRpId("example.com", tailnet)).toBe(false);
    expect(() => assertValidRpId("example.com", tailnet)).toThrow();
  });

  it("accepts rpID exactly equal to the hostname", () => {
    expect(isValidRpId("upshot.tailnet.ts.net", tailnet)).toBe(true);
    expect(() => assertValidRpId("upshot.tailnet.ts.net", tailnet)).not.toThrow();
  });

  it("accepts a registrable parent suffix with a dot", () => {
    expect(isValidRpId("ts.net", tailnet)).toBe(true);
    expect(isValidRpId("tailnet.ts.net", tailnet)).toBe(true);
    expect(() => assertValidRpId("ts.net", tailnet)).not.toThrow();
  });

  it("rejects a bare TLD (no dot) even if it is a suffix", () => {
    expect(isValidRpId("net", tailnet)).toBe(false);
    expect(() => assertValidRpId("net", tailnet)).toThrow();
  });

  it("accepts localhost in dev", () => {
    expect(isValidRpId("localhost", "http://localhost:3000")).toBe(true);
    expect(() => assertValidRpId("localhost", "http://localhost:3000")).not.toThrow();
  });

  it("rejects localhost when the host is not localhost", () => {
    expect(isValidRpId("localhost", tailnet)).toBe(false);
    expect(() => assertValidRpId("localhost", tailnet)).toThrow();
  });

  it("rejects a non-suffix partial match (foo.ts.net is not a suffix of host)", () => {
    expect(isValidRpId("foo.ts.net", tailnet)).toBe(false);
    expect(() => assertValidRpId("foo.ts.net", tailnet)).toThrow();
  });

  it("throws a descriptive (secret-free) error naming rpID and hostname", () => {
    expect(() => assertValidRpId("example.com", tailnet)).toThrow(/example\.com/);
    expect(() => assertValidRpId("example.com", tailnet)).toThrow(/upshot\.tailnet\.ts\.net/);
  });
});
