import { describe, expect, it } from "vitest";
import { SECURITY_HEADERS, buildCsp } from "./security-headers";

describe("SECURITY_HEADERS", () => {
  const byKey = (key: string): string | undefined =>
    SECURITY_HEADERS.find((h) => h.key === key)?.value;

  it("denies framing via X-Frame-Options", () => {
    expect(byKey("X-Frame-Options")).toBe("DENY");
  });

  it("disables MIME sniffing", () => {
    expect(byKey("X-Content-Type-Options")).toBe("nosniff");
  });

  it("sets a strict referrer policy", () => {
    expect(byKey("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });

  it("includes HSTS with a max-age", () => {
    const hsts = byKey("Strict-Transport-Security");
    expect(hsts).toBeDefined();
    expect(hsts).toContain("max-age=");
  });

  it("ships a Permissions-Policy that permits WebAuthn", () => {
    const pp = byKey("Permissions-Policy");
    expect(pp).toBeDefined();
    // The presence of this token is what keeps passkeys working.
    expect(pp).toContain("publickey-credentials-get=(self)");
  });
});

describe("buildCsp", () => {
  const csp = buildCsp("test-nonce");

  it("locks default-src to self", () => {
    expect(csp).toContain("default-src 'self'");
  });

  it("forbids being framed", () => {
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it("locks connect-src to self", () => {
    expect(csp).toContain("connect-src 'self'");
  });

  it("carries the per-request nonce in script-src", () => {
    expect(csp).toMatch(/script-src[^;]*'nonce-test-nonce'/);
  });
});
