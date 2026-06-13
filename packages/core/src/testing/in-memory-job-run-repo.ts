import type { JobRun, JobName } from "@upshot/contracts";
import type { CreateJobRun, FinishJobRun, JobRunRepo } from "../ports/job-run-repo";

export class InMemoryJobRunRepo implements JobRunRepo {
  private readonly store = new Map<string, JobRun>();
  private readonly order = new Map<string, number>();
  private seq = 0;

  async create(run: CreateJobRun): Promise<JobRun> {
    const row: JobRun = {
      id: run.id,
      job: run.job,
      status: "RUNNING",
      startedAt: run.startedAt,
      finishedAt: null,
      cursor: run.cursor ?? null,
      counts: null,
      error: null,
      attempt: 1,
    };
    this.store.set(run.id, row);
    this.order.set(run.id, this.seq++);
    return { ...row };
  }

  async finish(id: string, patch: FinishJobRun): Promise<void> {
    const row = this.store.get(id);
    if (!row) throw new Error(`job_run ${id} not found`);
    this.store.set(id, { ...row, ...patch });
  }

  async latestSuccessfulCursor(job: JobName): Promise<string | null> {
    return this.newest((r) => r.job === job && r.status === "SUCCESS")?.cursor ?? null;
  }

  async latest(job: JobName): Promise<JobRun | null> {
    return this.newest((r) => r.job === job) ?? null;
  }

  async getById(id: string): Promise<JobRun | null> {
    const row = this.store.get(id);
    return row ? { ...row } : null;
  }

  private newest(pred: (r: JobRun) => boolean): JobRun | undefined {
    let best: JobRun | undefined;
    let bestSeq = -1;
    for (const row of this.store.values()) {
      if (!pred(row)) continue;
      const seq = this.order.get(row.id) ?? -1;
      if (seq > bestSeq) {
        best = row;
        bestSeq = seq;
      }
    }
    return best ? { ...best } : undefined;
  }
}
