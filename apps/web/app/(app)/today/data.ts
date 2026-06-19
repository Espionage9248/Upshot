import { asc, eq } from "drizzle-orm";
import { computeNetWorth, computeSyncHealth, type SyncHealth } from "@upshot/core";
import { DrizzleAccountRepo, DrizzleAssetRepo, DrizzleJobRunRepo, tables, type DbClient } from "@upshot/db";

/** Account row as returned by the repo (avoids a direct @upshot/contracts dep in apps/web). */
type Account = Awaited<ReturnType<DrizzleAccountRepo["list"]>>[number];

/** Minimal upcoming-bill row surfaced on the Today room. */
export interface UpcomingBill {
  id: string;
  name: string;
  amountCents: number;
  nextExpectedDate: string | null;
  merchant: string | null;
  category: string | null;
}

/**
 * Placeholder insight type. No insight source exists in Phase 3, so this is
 * never populated — `insights` is always `[]` and the UI renders an Empty state.
 */
export type Insight = never;

export interface TodayData {
  syncHealth: SyncHealth;
  accounts: Account[];
  netWorthCents: number;
  upcomingBills: UpcomingBill[];
  insights: Insight[];
}

/**
 * Server-only loader for the Today room. Reads the encrypted DB in-process via
 * injected `db` (so it constructs nothing at module load — preserves the
 * env-free `next build` invariant and stays testable). Returns domain data
 * only; never the encryption key, env, or raw error stacks.
 */
export async function loadTodayData(db: DbClient, now: Date = new Date()): Promise<TodayData> {
  const jobRunRepo = new DrizzleJobRunRepo(db);
  const accountRepo = new DrizzleAccountRepo(db);

  const syncHealth = computeSyncHealth(await jobRunRepo.latest("SYNC"), now);
  const accounts = await accountRepo.list();
  const assets = await new DrizzleAssetRepo(db).list();
  const debtRows = db
    .select({ currentBalanceCents: tables.debts.currentBalanceCents, includeInNetWorth: tables.debts.includeInNetWorth })
    .from(tables.debts)
    .all();
  const netWorthCents = computeNetWorth({
    accountBalancesCents: accounts.map((a) => a.balanceCents),
    assets: assets.map((a) => ({ valueCents: a.valueCents, includeInNetWorth: a.includeInNetWorth })),
    debts: debtRows,
  });

  const billRows = db
    .select({
      id: tables.recurringItems.id,
      name: tables.recurringItems.name,
      amountCents: tables.recurringItems.amountCents,
      nextExpectedDate: tables.recurringItems.nextExpectedDate,
      merchant: tables.recurringItems.merchant,
      category: tables.recurringItems.category,
    })
    .from(tables.recurringItems)
    .where(eq(tables.recurringItems.status, "ACTIVE"))
    .orderBy(asc(tables.recurringItems.nextExpectedDate))
    .all();

  return {
    syncHealth,
    accounts,
    netWorthCents,
    upcomingBills: billRows,
    insights: [],
  };
}
