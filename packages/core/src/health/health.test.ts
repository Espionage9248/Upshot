import { describe, it, expect } from "vitest";
import { computeSyncHealth } from "./health";
import type { JobRun } from "@upshot/contracts";

function run(over: Partial<JobRun>): JobRun {
  return { id: "j", job: "SYNC", status: "SUCCESS", startedAt: "2026-06-13T09:00:00.000Z", finishedAt: "2026-06-13T09:01:00.000Z", cursor: null, counts: null, error: null, attempt: 1, ...over };
}
const now = new Date("2026-06-13T10:01:00.000Z");

describe("computeSyncHealth", () => {
  it("reports no sync when there is no run", () => {
    expect(computeSyncHealth(null, now)).toEqual({ lastSyncAt: null, lastSyncAgeMs: null, lastStatus: null, tokenHealthy: true });
  });

  it("computes age from finishedAt and a healthy token on success", () => {
    const h = computeSyncHealth(run({}), now);
    expect(h.lastSyncAt).toBe("2026-06-13T09:01:00.000Z");
    expect(h.lastSyncAgeMs).toBe(60 * 60 * 1000);
    expect(h.lastStatus).toBe("SUCCESS");
    expect(h.tokenHealthy).toBe(true);
  });

  it("marks the token unhealthy when the latest run failed with an auth error", () => {
    const h = computeSyncHealth(run({ status: "FAILED", finishedAt: "2026-06-13T09:30:00.000Z", error: "Up API auth failed (HTTP 401)" }), now);
    expect(h.tokenHealthy).toBe(false);
  });

  it("keeps the token healthy on a non-auth failure", () => {
    const h = computeSyncHealth(run({ status: "FAILED", error: "network down" }), now);
    expect(h.tokenHealthy).toBe(true);
  });

  it("falls back to startedAt when finishedAt is null (still running)", () => {
    const h = computeSyncHealth(run({ status: "RUNNING", finishedAt: null }), now);
    expect(h.lastSyncAt).toBe("2026-06-13T09:00:00.000Z");
  });
});
