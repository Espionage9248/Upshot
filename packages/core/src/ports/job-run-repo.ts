import type { JobRun, JobName, JobStatus } from "@upshot/contracts";

export interface CreateJobRun {
  id: string;
  job: JobName;
  startedAt: string;
  cursor?: string | null;
}

export interface FinishJobRun {
  status: Extract<JobStatus, "SUCCESS" | "FAILED">;
  finishedAt: string;
  cursor: string | null;
  counts: Record<string, number> | null;
  error: string | null;
}

export interface JobRunRepo {
  /** Insert a RUNNING row. */
  create(run: CreateJobRun): Promise<JobRun>;
  /** Update an existing row to a terminal state. */
  finish(id: string, patch: FinishJobRun): Promise<void>;
  /** Cursor of the most recent SUCCESS run for `job`, or null. */
  latestSuccessfulCursor(job: JobName): Promise<string | null>;
  /** Most recent run of any status for `job`, or null (health). */
  latest(job: JobName): Promise<JobRun | null>;
  getById(id: string): Promise<JobRun | null>;
}
