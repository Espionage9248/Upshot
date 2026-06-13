import { describe, it, expect, vi } from "vitest";
import { cadenceToCron, runSyncOnce } from "./scheduler";
import { CircuitBreaker } from "./circuit-breaker";
import type { Notifier } from "./notifier";
import type { SyncResult } from "@upshot/core";

function recordingNotifier(): Notifier & { sent: Array<{ title: string; body: string; priority?: string }> } {
  const sent: Array<{ title: string; body: string; priority?: string }> = [];
  return { sent, notify: async (m) => { sent.push(m); } };
}

const ok: SyncResult = { jobRunId: "j", status: "SUCCESS", counts: { transactions: 1 }, authFailed: false };
const failAuth: SyncResult = { jobRunId: "j", status: "FAILED", counts: {}, authFailed: true, error: "Up API auth failed (HTTP 401)" };
const failNet: SyncResult = { jobRunId: "j", status: "FAILED", counts: {}, authFailed: false, error: "network down" };

describe("cadenceToCron", () => {
  it("maps each cadence to a cron expression", () => {
    expect(cadenceToCron("REALTIME")).toBe("*/5 * * * *");
    expect(cadenceToCron("HOURLY")).toBe("0 * * * *");
    expect(cadenceToCron("DAILY")).toBe("0 3 * * *");
  });
});

describe("runSyncOnce", () => {
  it("runs sync, records success on the breaker, and sends no alert", async () => {
    const sync = vi.fn().mockResolvedValue(ok);
    const notifier = recordingNotifier();
    const breaker = new CircuitBreaker(3);
    const r = await runSyncOnce({ sync }, notifier, breaker, { notifyOnSyncFail: true });
    expect(r.status).toBe("SUCCESS");
    expect(notifier.sent).toEqual([]);
    expect(breaker.isOpen()).toBe(false);
  });

  it("sends an urgent reconnect alert on an auth failure", async () => {
    const sync = vi.fn().mockResolvedValue(failAuth);
    const notifier = recordingNotifier();
    await runSyncOnce({ sync }, notifier, new CircuitBreaker(3), { notifyOnSyncFail: true });
    expect(notifier.sent).toHaveLength(1);
    expect(notifier.sent[0]?.priority).toBe("urgent");
    expect(notifier.sent[0]?.title).toMatch(/reconnect/i);
  });

  it("sends a high-priority alert on a non-auth failure", async () => {
    const sync = vi.fn().mockResolvedValue(failNet);
    const notifier = recordingNotifier();
    await runSyncOnce({ sync }, notifier, new CircuitBreaker(3), { notifyOnSyncFail: true });
    expect(notifier.sent[0]?.priority).toBe("high");
  });

  it("suppresses alerts when notifyOnSyncFail is false", async () => {
    const sync = vi.fn().mockResolvedValue(failNet);
    const notifier = recordingNotifier();
    await runSyncOnce({ sync }, notifier, new CircuitBreaker(3), { notifyOnSyncFail: false });
    expect(notifier.sent).toEqual([]);
  });

  it("opens the breaker after N consecutive failures and then skips the sync", async () => {
    const sync = vi.fn().mockResolvedValue(failNet);
    const notifier = recordingNotifier();
    const breaker = new CircuitBreaker(2);
    await runSyncOnce({ sync }, notifier, breaker, { notifyOnSyncFail: false });
    await runSyncOnce({ sync }, notifier, breaker, { notifyOnSyncFail: false });
    expect(breaker.isOpen()).toBe(true);
    const r = await runSyncOnce({ sync }, notifier, breaker, { notifyOnSyncFail: false });
    expect(r.status).toBe("SKIPPED");
    expect(sync).toHaveBeenCalledTimes(2); // third call short-circuited
  });

  it("a success resets the breaker failure count", async () => {
    const breaker = new CircuitBreaker(2);
    breaker.recordFailure();
    breaker.recordSuccess();
    breaker.recordFailure();
    expect(breaker.isOpen()).toBe(false);
  });
});
