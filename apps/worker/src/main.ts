import { Cron } from "croner";
import {
  createDbClientFromEnv, applyMigrations, seed,
  DrizzleAccountRepo, DrizzleTransactionRepo, DrizzleCategoryRepo,
  DrizzleMatchRuleRepo, DrizzleJobRunRepo, DrizzleSettingsRepo, type DbClient,
  runSnapshotOnce, runFeesOnce, runDetectOnce,
} from "@upshot/db";
import { SyncService, UpClient } from "@upshot/core";
import { NtfyNotifier, NullNotifier, type Notifier } from "./notifier";
import { CircuitBreaker } from "./circuit-breaker";
import { cadenceToCron, runSyncOnce } from "./scheduler";

const CIRCUIT_BREAKER_THRESHOLD = 5;

export interface StartedWorker {
  stop(): void;
  runNow(): Promise<void>;
}

/** Build the worker from the environment and start the croner schedule. */
export async function start(log: (message: string) => void = console.log): Promise<StartedWorker> {
  const token = requireEnv("UP_API_TOKEN");
  const { db } = createDbClientFromEnv();
  applyMigrations(db as DbClient);
  seed(db as DbClient); // idempotent (onConflictDoNothing) — settings row + saver-interest rule

  const settingsRepo = new DrizzleSettingsRepo(db as DbClient);
  const jobRuns = new DrizzleJobRunRepo(db as DbClient);
  const svc = new SyncService({
    up: new UpClient({ token, baseUrl: process.env.UP_API_BASE_URL }),
    accounts: new DrizzleAccountRepo(db as DbClient),
    transactions: new DrizzleTransactionRepo(db as DbClient),
    categories: new DrizzleCategoryRepo(db as DbClient),
    matchRules: new DrizzleMatchRuleRepo(db as DbClient),
    jobRuns,
  });

  const notifier: Notifier = process.env.NTFY_URL ? new NtfyNotifier(process.env.NTFY_URL) : new NullNotifier();
  const breaker = new CircuitBreaker(CIRCUIT_BREAKER_THRESHOLD);

  const settings = await settingsRepo.get();
  const cron = cadenceToCron(settings?.syncCadence ?? "DAILY");
  const notifyOnSyncFail = settings?.notifyOnSyncFail ?? true;

  // A tick must never throw into the scheduler — alerting/ledger failures are logged, not fatal.
  const tick = async (): Promise<void> => {
    try {
      const outcome = await runSyncOnce(svc, notifier, breaker, { notifyOnSyncFail });
      log(`sync tick: ${outcome.status}`);
    } catch (err) {
      log(`sync tick error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const snapshotTick = async (): Promise<void> => {
    try { const runId = await runSnapshotOnce({ db: db as DbClient, jobRuns }); log(`snapshot tick: ${runId}`); }
    catch (err) { log(`snapshot tick error: ${err instanceof Error ? err.message : String(err)}`); }
  };

  const feesTick = async (): Promise<void> => {
    try { const runId = await runFeesOnce({ db: db as DbClient, jobRuns }); log(`fees tick: ${runId}`); }
    catch (err) { log(`fees tick error: ${err instanceof Error ? err.message : String(err)}`); }
  };

  const autoDetectRecurring = settings?.autoDetectRecurring ?? true;
  const detectTick = async (): Promise<void> => {
    try {
      const runId = await runDetectOnce({
        db: db as DbClient,
        jobRuns,
        settings: { autoDetectRecurring },
      });
      log(`detect tick: ${runId}`);
    } catch (err) {
      log(`detect tick error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const job = new Cron(cron, () => { void tick(); });
  const snapshotJob = new Cron("0 4 1 * *", () => { void snapshotTick(); });
  const feesJob = new Cron("0 2 * * *", () => { void feesTick(); });
  const detectJob = new Cron("0 5 * * *", () => { void detectTick(); });
  log(`worker started (cadence ${settings?.syncCadence ?? "DAILY"} -> "${cron}")`);
  return {
    stop: () => { job.stop(); snapshotJob.stop(); feesJob.stop(); detectJob.stop(); },
    runNow: tick,
  };
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set; refusing to start the worker`);
  return value;
}
