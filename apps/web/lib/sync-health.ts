import { computeSyncHealth, type SyncHealth } from "@upshot/core";
import { DrizzleJobRunRepo, type DbClient } from "@upshot/db";

export { syncHealthToState } from "./sync-state";

/** Latest SYNC run → SyncHealth. db-injected + testable; no auth/env here. */
export async function loadSyncHealth(
  db: DbClient,
  now: Date = new Date(),
): Promise<SyncHealth> {
  return computeSyncHealth(await new DrizzleJobRunRepo(db).latest("SYNC"), now);
}
