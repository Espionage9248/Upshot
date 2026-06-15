import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock the auth re-check so the wrapper can be exercised without a server runtime.
const getSession = vi.fn();
vi.mock("./auth-guard", () => ({
  getSession: () => getSession(),
}));

import { action } from "./action";

const SESSION = { user: { id: "u1" }, session: { id: "s1" } };

describe("action", () => {
  beforeEach(() => {
    getSession.mockReset();
  });

  it("returns { ok: true, data } when authenticated and the handler succeeds", async () => {
    getSession.mockResolvedValue(SESSION);
    const wrapped = action(async (_session, n: number) => n * 2);

    const result = await wrapped(21);

    expect(result).toEqual({ ok: true, data: 42 });
  });

  it("passes the authenticated session to the handler", async () => {
    getSession.mockResolvedValue(SESSION);
    const handler = vi.fn(async () => "ok");
    const wrapped = action(handler);

    await wrapped();

    expect(handler).toHaveBeenCalledWith(SESSION);
  });

  it("short-circuits to the unauthorized contract before the handler runs", async () => {
    getSession.mockResolvedValue(null);
    const handler = vi.fn(async () => "should-not-run");
    const wrapped = action(handler);

    const result = await wrapped();

    expect(result).toEqual({
      ok: false,
      error: { code: "unauthorized", message: expect.any(String) },
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it("maps a thrown error to a safe internal result (no stack / secret leak)", async () => {
    getSession.mockResolvedValue(SESSION);
    const secret = "BETTER_AUTH_SECRET=super-secret-value";
    const wrapped = action(async () => {
      throw new Error(secret);
    });

    const result = await wrapped();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("internal");
      expect(result.error.message).not.toContain(secret);
      expect(result.error.message).not.toContain("Error");
      expect(result.error.message.length).toBeGreaterThan(0);
    }
  });
});
