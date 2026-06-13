// packages/core/src/up/retry.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { withRetry } from "./retry";

const sleeps: number[] = [];
const sleep = (ms: number) => { sleeps.push(ms); return Promise.resolve(); };
const noRandom = () => 0; // jitter = 0
const always = () => true;
const never = () => false;
const noRetryAfter = () => null;

beforeEach(() => { sleeps.length = 0; });

describe("withRetry", () => {
  it("returns the first success without sleeping", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const r = await withRetry(fn, always, noRetryAfter, { sleep, random: noRandom });
    expect(r).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(sleeps).toEqual([]);
  });

  it("retries retryable errors up to maxAttempts then throws the last error", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("boom"));
    await expect(
      withRetry(fn, always, noRetryAfter, { sleep, random: noRandom, maxAttempts: 3, baseDelayMs: 100 }),
    ).rejects.toThrow("boom");
    expect(fn).toHaveBeenCalledTimes(3);
    // backoff for attempts 1 and 2 (no sleep after the final failure): 100, 200
    expect(sleeps).toEqual([100, 200]);
  });

  it("does not retry a non-retryable error", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("fatal"));
    await expect(withRetry(fn, never, noRetryAfter, { sleep, random: noRandom })).rejects.toThrow("fatal");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(sleeps).toEqual([]);
  });

  it("honours retryAfterMs over computed backoff", async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error("429")).mockResolvedValue("ok");
    const r = await withRetry(fn, always, () => 2500, { sleep, random: noRandom, baseDelayMs: 100 });
    expect(r).toBe("ok");
    expect(sleeps).toEqual([2500]);
  });

  it("caps backoff at maxDelayMs and adds jitter from random()", async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error("e"))
      .mockRejectedValueOnce(new Error("e"))
      .mockResolvedValue("ok");
    // base 1000, cap 1500, random 1 → jitter = backoff*0.5
    const r = await withRetry(fn, always, noRetryAfter, { sleep, random: () => 1, baseDelayMs: 1000, maxDelayMs: 1500 });
    expect(r).toBe("ok");
    // attempt1 backoff 1000 + jitter 500 = 1500; attempt2 backoff min(1500, 2000)=1500 + 750 = 2250
    expect(sleeps).toEqual([1500, 2250]);
  });
});
