"use server";

/**
 * Job Server Actions — manual triggers for FEES, DETECT, SNAPSHOT.
 *
 * These jobs are token-free (no UpClient / UP_API_TOKEN) and run in-process,
 * writing a real job_run row just like the worker's cron ticks. SYNC is
 * deliberately excluded — it requires UP_API_TOKEN and must remain in the
 * worker process (env-free build invariant).
 *
 * Each action re-checks auth via action(), runs the job, revalidates the
 * Sync & activity page so the new run row appears in the Runs tab, and
 * returns the jobRunId.
 */

import { revalidatePath } from "next/cache";
import { action } from "@/lib/action";
import { getDb } from "@/lib/db";
import {
  DrizzleJobRunRepo, DrizzleSettingsRepo,
  runFeesOnce, runDetectOnce, runSnapshotOnce,
} from "@upshot/db";

/** Action: run a DETECT tick in-process and refresh the activity view. */
export const runDetectNowAction = action(async () => {
  const { db } = getDb();
  const settings = await new DrizzleSettingsRepo(db).get();
  const autoDetectRecurring = settings?.autoDetectRecurring ?? true;
  const jobRuns = new DrizzleJobRunRepo(db);
  const jobRunId = await runDetectOnce({ db, jobRuns, settings: { autoDetectRecurring } });
  revalidatePath("/settings/sync-activity");
  return { jobRunId };
});

/** Action: run a FEES tick in-process and refresh the activity view. */
export const runFeesNowAction = action(async () => {
  const { db } = getDb();
  const jobRuns = new DrizzleJobRunRepo(db);
  const jobRunId = await runFeesOnce({ db, jobRuns });
  revalidatePath("/settings/sync-activity");
  return { jobRunId };
});

/** Action: run a SNAPSHOT tick in-process and refresh the activity view. */
export const runSnapshotNowAction = action(async () => {
  const { db } = getDb();
  const jobRuns = new DrizzleJobRunRepo(db);
  const jobRunId = await runSnapshotOnce({ db, jobRuns });
  revalidatePath("/settings/sync-activity");
  return { jobRunId };
});
