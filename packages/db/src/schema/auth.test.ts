import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/sqlite-core";
import { toSnakeCase } from "drizzle-orm/casing";
import { user, session, account, verification, passkey } from "./auth";

function cols(t: Parameters<typeof getTableConfig>[0]): string[] {
  return getTableConfig(t).columns.map((c) => toSnakeCase(c.name));
}

describe("better-auth schema", () => {
  it("declares the five auth tables with their canonical names", () => {
    expect(getTableConfig(user).name).toBe("user");
    expect(getTableConfig(session).name).toBe("session");
    expect(getTableConfig(account).name).toBe("account");
    expect(getTableConfig(verification).name).toBe("verification");
    expect(getTableConfig(passkey).name).toBe("passkey");
  });

  it("user has id + email", () => {
    const c = cols(user);
    expect(c).toContain("id");
    expect(c).toContain("email");
  });

  it("session has user_id, token, expires_at", () => {
    const c = cols(session);
    expect(c).toContain("user_id");
    expect(c).toContain("token");
    expect(c).toContain("expires_at");
  });

  it("passkey has user_id, public_key, credential_id, counter", () => {
    const c = cols(passkey);
    expect(c).toContain("user_id");
    expect(c).toContain("public_key");
    expect(c).toContain("credential_id");
    expect(c).toContain("counter");
  });

  it("verification has identifier + value", () => {
    const c = cols(verification);
    expect(c).toContain("identifier");
    expect(c).toContain("value");
  });

  it("indexes the session and passkey lookup columns", () => {
    const sessionIdx = getTableConfig(session).indexes.map((i) => i.config.name);
    expect(sessionIdx).toContain("session_user_idx");
    const passkeyIdx = getTableConfig(passkey).indexes.map((i) => i.config.name);
    expect(passkeyIdx).toContain("passkey_user_idx");
  });
});
