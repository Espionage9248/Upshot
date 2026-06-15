import { desc } from "drizzle-orm";
import { computeSyncHealth, type SyncHealth } from "@upshot/core";
import { DrizzleJobRunRepo, tables, type DbClient } from "@upshot/db";
import type { UIconKey } from "@upshot/ui";

/** Drizzle row shapes, derived locally (apps/web does not depend on @upshot/contracts). */
type JobRunRow = typeof tables.jobRuns.$inferSelect;
type EventLogRow = typeof tables.eventLog.$inferSelect;

/** Display state derived from a run's status + error (token = a 401/403 FAILED). */
export type RunState = "success" | "running" | "failed" | "token";

export interface RunRow {
  id: string;
  job: string;
  jobLabel: string;
  icon: UIconKey;
  state: RunState;
  /** True only for the token state — the row carries the coral "Reconnect" affordance. */
  reconnect: boolean;
  result: string;
  duration: string;
  when: string;
}

export interface ActivityRow {
  id: string;
  icon: UIconKey;
  description: string;
  when: string;
}

export interface SyncActivityData {
  runs: RunRow[];
  activity: ActivityRow[];
  health: SyncHealth;
  lastSyncAt: string | null;
}

const ROW_LIMIT = 50;

/** Job enum → human label + Runs-table icon (from round3.jsx). */
const JOB_META: Record<string, { label: string; icon: UIconKey }> = {
  SYNC: { label: "Transaction sync", icon: "sync" },
  FEES: { label: "Fee scan", icon: "percent" },
  DETECT: { label: "Recurring detect", icon: "repeat" },
  BACKUP: { label: "Encrypted backup", icon: "shield" },
};

function deriveState(status: string, error: string | null): RunState {
  if (status === "RUNNING") return "running";
  if (status === "FAILED") return /\b401\b|\b403\b/.test(error ?? "") ? "token" : "failed";
  return "success";
}

/** "2.1s" from finished−started; "—" when a run hasn't finished. */
function formatDuration(startedAt: string, finishedAt: string | null): string {
  if (!finishedAt) return "—";
  const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "—";
  return `${(ms / 1000).toFixed(1)}s`;
}

/** Short, deterministic relative timestamp ("4m ago" / "1d ago" / "just now"). */
function formatWhen(iso: string, now: Date): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) return "just now";
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** Short result summary from counts / error — never the raw error string for a token run. */
function deriveResult(run: JobRunRow, state: RunState): string {
  if (state === "token") return "session expired (401)";
  if (state === "failed") return "failed";
  if (state === "running") return "running…";
  const counts = run.counts;
  if (counts && Object.keys(counts).length > 0) {
    return Object.entries(counts)
      .map(([k, v]) => `${v} ${k}`)
      .join(" · ");
  }
  return "done";
}

/**
 * Server-only loader for the Sync & activity page. db-injected (constructs
 * nothing at module load → preserves the env-free `next build` invariant and
 * stays testable). Reads job_runs + event_log directly and returns domain
 * display data only — never the encryption key, env, or raw error stacks.
 */
export async function loadSyncActivity(
  db: DbClient,
  now: Date = new Date(),
): Promise<SyncActivityData> {
  const runRows = db
    .select()
    .from(tables.jobRuns)
    .orderBy(desc(tables.jobRuns.startedAt))
    .limit(ROW_LIMIT)
    .all() as JobRunRow[];

  const activityRows = db
    .select()
    .from(tables.eventLog)
    .orderBy(desc(tables.eventLog.createdAt))
    .limit(ROW_LIMIT)
    .all() as EventLogRow[];

  const runs: RunRow[] = runRows.map((r) => {
    const state = deriveState(r.status, r.error);
    const meta = JOB_META[r.job] ?? { label: r.job, icon: "clock" as UIconKey };
    return {
      id: r.id,
      job: r.job,
      jobLabel: meta.label,
      icon: meta.icon,
      state,
      reconnect: state === "token",
      result: deriveResult(r, state),
      duration: formatDuration(r.startedAt, r.finishedAt),
      when: formatWhen(r.startedAt, now),
    };
  });

  const activity: ActivityRow[] = activityRows.map((e) => ({
    id: e.id,
    icon: "dot",
    description: e.description,
    when: formatWhen(e.createdAt, now),
  }));

  const health = computeSyncHealth(await new DrizzleJobRunRepo(db).latest("SYNC"), now);

  return { runs, activity, health, lastSyncAt: health.lastSyncAt };
}
