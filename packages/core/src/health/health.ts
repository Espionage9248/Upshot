import type { JobRun, JobStatus } from "@upshot/contracts";

export interface SyncHealth {
  lastSyncAt: string | null;
  lastSyncAgeMs: number | null;
  lastStatus: JobStatus | null;
  tokenHealthy: boolean;
}

/** Derive sync health from the latest SYNC run. Token health follows 401/403 — Up PATs do not rotate. */
export function computeSyncHealth(latest: JobRun | null, now: Date): SyncHealth {
  if (!latest) return { lastSyncAt: null, lastSyncAgeMs: null, lastStatus: null, tokenHealthy: true };
  const at = latest.finishedAt ?? latest.startedAt;
  const authFailure = latest.status === "FAILED" && /auth|401|403/i.test(latest.error ?? "");
  return {
    lastSyncAt: at,
    lastSyncAgeMs: now.getTime() - new Date(at).getTime(),
    lastStatus: latest.status,
    tokenHealthy: !authFailure,
  };
}
