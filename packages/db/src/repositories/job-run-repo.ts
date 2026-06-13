import { and, desc, eq } from "drizzle-orm";
import type { JobRunRepo, CreateJobRun, FinishJobRun } from "@upshot/core";
import type { JobRun, JobName } from "@upshot/contracts";
import type { DbClient } from "../client";
import { jobRuns } from "../schema";

export class DrizzleJobRunRepo implements JobRunRepo {
  constructor(private readonly db: DbClient) {}

  async create(run: CreateJobRun): Promise<JobRun> {
    this.db.insert(jobRuns).values({
      id: run.id, job: run.job, status: "RUNNING",
      startedAt: run.startedAt, cursor: run.cursor ?? null, attempt: 1,
    }).run();
    return (await this.getById(run.id))!;
  }

  async finish(id: string, patch: FinishJobRun): Promise<void> {
    this.db.update(jobRuns).set({
      status: patch.status, finishedAt: patch.finishedAt,
      cursor: patch.cursor, counts: patch.counts, error: patch.error,
    }).where(eq(jobRuns.id, id)).run();
  }

  async latestSuccessfulCursor(job: JobName): Promise<string | null> {
    const row = this.db.select().from(jobRuns)
      .where(and(eq(jobRuns.job, job), eq(jobRuns.status, "SUCCESS")))
      .orderBy(desc(jobRuns.startedAt)).limit(1).get();
    return row?.cursor ?? null;
  }

  async latest(job: JobName): Promise<JobRun | null> {
    return this.db.select().from(jobRuns)
      .where(eq(jobRuns.job, job))
      .orderBy(desc(jobRuns.startedAt)).limit(1).get() ?? null;
  }

  async getById(id: string): Promise<JobRun | null> {
    return this.db.select().from(jobRuns).where(eq(jobRuns.id, id)).get() ?? null;
  }
}
