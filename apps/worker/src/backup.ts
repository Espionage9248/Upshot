import { randomUUID } from "node:crypto";
import type { JobRunRepo } from "@upshot/core";

/**
 * Phase 8 will replace this with Litestream. For now it records a no-op BACKUP
 * run so the runs ledger and health surface have a backup data point.
 */
export async function runBackupStub(
  jobRuns: JobRunRepo,
  opts: { newId?: () => string; now?: () => Date } = {},
): Promise<string> {
  const newId = opts.newId ?? (() => randomUUID());
  const now = opts.now ?? (() => new Date());
  const id = newId();
  const startedAt = now().toISOString();
  await jobRuns.create({ id, job: "BACKUP", startedAt });
  await jobRuns.finish(id, { status: "SUCCESS", finishedAt: now().toISOString(), cursor: null, counts: { backedUp: 0 }, error: null });
  return id;
}
