// packages/core/src/up/retry.ts
export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
}

/**
 * Run `fn`, retrying while `isRetryable(err)` and attempts remain. Sleeps the
 * `retryAfterMs(err)` value when present, otherwise capped exponential backoff
 * with up-to-50% jitter. No sleep happens after the final attempt.
 */
export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  isRetryable: (err: unknown) => boolean,
  retryAfterMs: (err: unknown) => number | null,
  opts: RetryOptions = {},
): Promise<T> {
  const maxAttempts = opts.maxAttempts ?? 5;
  const base = opts.baseDelayMs ?? 500;
  const cap = opts.maxDelayMs ?? 30_000;
  const sleep = opts.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  const random = opts.random ?? Math.random;

  let attempt = 0;
  for (;;) {
    attempt++;
    try {
      return await fn(attempt);
    } catch (err) {
      if (attempt >= maxAttempts || !isRetryable(err)) throw err;
      const explicit = retryAfterMs(err);
      if (explicit !== null) {
        await sleep(explicit);
      } else {
        const backoff = Math.min(cap, base * 2 ** (attempt - 1));
        await sleep(backoff + backoff * 0.5 * random());
      }
    }
  }
}
