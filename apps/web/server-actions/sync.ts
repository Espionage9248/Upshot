"use server";

/**
 * Sync Server Action ("Sync now").
 *
 * Security invariant (single-user app): the action re-checks the session
 * server-side via action(), which short-circuits an unauthenticated call before
 * doing anything and returns a safe ActionResult. No secret is ever logged.
 *
 * Phase 3 semantics — deliberately a no-op trigger:
 *   The worker (apps/worker) is a SEPARATE process with its own croner schedule;
 *   it creates its own job_runs and consumes no external "sync request". There is
 *   no web→worker trigger mechanism in Phase 3 (no queue table, no HTTP endpoint,
 *   no signal — web and worker only share the encrypted DB). So this action does
 *   NOT:
 *     - record a RUNNING job_run (it would be orphaned — no worker in THIS process
 *       to finish it — and show "Running" forever), nor
 *     - import UpClient/SyncService or run a sync inline (needs UP_API_TOKEN,
 *       which would break the env-free build + the process separation).
 *   It re-checks auth and returns success without fabricating a run. The button's
 *   onClick calls router.refresh() on ok so any runs newly written by the worker
 *   reload. The real web→worker trigger (IPC) lands in a later phase.
 */

import { action } from "@/lib/action";

/** Action: request a sync. Re-checks auth; returns the contract (no run fabricated). */
export const syncNowAction = action(async () => {
  return { requested: true } as const;
});
