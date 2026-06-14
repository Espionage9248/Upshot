import { describe, expect, it, vi, beforeEach } from "vitest";

// Mocks must be declared before importing the module under test.
const getSession = vi.fn();
const redirect = vi.fn();

vi.mock("./auth", () => ({
  getAuth: () => ({ api: { getSession } }),
}));
vi.mock("next/headers", () => ({
  headers: () => Promise.resolve(new Headers()),
}));
vi.mock("next/navigation", () => ({
  redirect: (to: string) => redirect(to),
}));

import { requireSession } from "./auth-guard";

describe("requireSession", () => {
  beforeEach(() => {
    getSession.mockReset();
    redirect.mockReset();
  });

  it("returns the session when a user is present", async () => {
    const session = { user: { id: "u1" }, session: { id: "s1" } };
    getSession.mockResolvedValue(session);

    const result = await requireSession();

    expect(result).toBe(session);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects to /login when there is no session", async () => {
    getSession.mockResolvedValue(null);

    await requireSession();

    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("redirects to /login when the session has no user", async () => {
    getSession.mockResolvedValue({ session: { id: "s1" } });

    await requireSession();

    expect(redirect).toHaveBeenCalledWith("/login");
  });
});
