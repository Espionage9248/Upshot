import { describe, it, expect } from "vitest";
import { UpHttpError, UpAuthError } from "./types";

describe("Up error types", () => {
  it("UpHttpError carries status, path, and optional retryAfterMs but never a token", () => {
    const err = new UpHttpError(500, "/transactions", "Up API error 500", 2000);
    expect(err.status).toBe(500);
    expect(err.path).toBe("/transactions");
    expect(err.retryAfterMs).toBe(2000);
    expect(err.message).not.toMatch(/bearer/i);
  });

  it("UpAuthError is a UpHttpError with no retryAfter and an auth message", () => {
    const err = new UpAuthError(401, "/util/ping");
    expect(err).toBeInstanceOf(UpHttpError);
    expect(err.status).toBe(401);
    expect(err.retryAfterMs).toBeUndefined();
    expect(err.message).toMatch(/auth/i);
  });
});
