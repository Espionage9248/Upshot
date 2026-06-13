import type { SyncCadence } from "@upshot/contracts";
import type { SyncResult } from "@upshot/core";
import type { CircuitBreaker } from "./circuit-breaker";
import type { Notifier } from "./notifier";

export function cadenceToCron(cadence: SyncCadence): string {
  switch (cadence) {
    case "REALTIME": return "*/5 * * * *"; // Up personal tokens have no webhooks — poll every 5 min
    case "HOURLY": return "0 * * * *";
    case "DAILY": return "0 3 * * *";
  }
}

export interface Syncable {
  sync(opts: { mode: "full" | "incremental" }): Promise<SyncResult>;
}

export type RunOutcome = SyncResult | { status: "SKIPPED"; jobRunId: null; counts: Record<string, number>; authFailed: false };

/**
 * One scheduled tick: skip if the breaker is open; otherwise run an incremental
 * sync, update the breaker, and alert on failure (respecting notifyOnSyncFail).
 */
export async function runSyncOnce(
  svc: Syncable,
  notifier: Notifier,
  breaker: CircuitBreaker,
  settings: { notifyOnSyncFail: boolean },
): Promise<RunOutcome> {
  if (breaker.isOpen()) {
    return { status: "SKIPPED", jobRunId: null, counts: {}, authFailed: false };
  }
  const result = await svc.sync({ mode: "incremental" });
  if (result.status === "FAILED") {
    breaker.recordFailure();
    if (settings.notifyOnSyncFail) {
      await notifier.notify(
        result.authFailed
          ? { title: "Up token needs reconnect", body: result.error ?? "Authentication failed", priority: "urgent" }
          : { title: "Upshot sync failed", body: result.error ?? "Unknown error", priority: "high" },
      );
    }
  } else {
    breaker.recordSuccess();
  }
  return result;
}
