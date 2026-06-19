import { asc } from "drizzle-orm";
import { computeNetWorth } from "@upshot/core";
import { DrizzleAccountRepo, DrizzleAssetRepo, tables, type DbClient } from "@upshot/db";

/** An asset row as returned by the repo (avoids a direct @upshot/contracts dep in apps/web). */
export type AssetRow = Awaited<ReturnType<DrizzleAssetRepo["list"]>>[number];

/** One point on the net-worth trend: assets up, debts down, net line. Integer cents. */
export interface TrendPoint {
  /** ISO date or month label for ordering/axis (e.g. "2026-05" or "2026-05-01T..."). */
  at: string;
  assetsCents: number;
  debtsCents: number;
  netCents: number;
}

export interface NetWorthData {
  totalCents: number;
  assets: AssetRow[];
  trend: TrendPoint[];
}

/**
 * Server-only loader for the /net-worth surface. Reads the encrypted DB
 * in-process via injected `db` (constructs nothing at module load — preserves
 * the env-free `next build` invariant and stays testable). Returns domain data
 * only; never the encryption key, env, or raw error stacks.
 *
 * Trend source: prefers `monthly_snapshots` (carries assets/debts/net per month
 * — the three series the chart draws). When no snapshots exist yet (the common
 * early-life case), falls back to the `asset_valuations` series with debts
 * unknown (0), so the chart still shows the asset trajectory.
 */
export async function loadNetWorthData(db: DbClient): Promise<NetWorthData> {
  const accounts = await new DrizzleAccountRepo(db).list();
  const assets = await new DrizzleAssetRepo(db).list();
  const debtRows = db
    .select({
      currentBalanceCents: tables.debts.currentBalanceCents,
      includeInNetWorth: tables.debts.includeInNetWorth,
    })
    .from(tables.debts)
    .all();

  const totalCents = computeNetWorth({
    accountBalancesCents: accounts.map((a) => a.balanceCents),
    assets: assets.map((a) => ({ valueCents: a.valueCents, includeInNetWorth: a.includeInNetWorth })),
    debts: debtRows,
  });

  return { totalCents, assets, trend: loadTrend(db) };
}

/** Build the trend series — monthly_snapshots first, asset_valuations as fallback. */
function loadTrend(db: DbClient): TrendPoint[] {
  const snapshots = db
    .select({
      month: tables.monthlySnapshots.month,
      assetsCents: tables.monthlySnapshots.assetsCents,
      debtCents: tables.monthlySnapshots.debtCents,
      netWorthCents: tables.monthlySnapshots.netWorthCents,
    })
    .from(tables.monthlySnapshots)
    .orderBy(asc(tables.monthlySnapshots.month))
    .all();

  if (snapshots.length > 0) {
    return snapshots.map((s) => ({
      at: s.month,
      assetsCents: s.assetsCents,
      debtsCents: s.debtCents,
      netCents: s.netWorthCents,
    }));
  }

  // Fallback: per-asset valuations. Debts have no historical series here, so
  // debtsCents is 0 and netCents == assetsCents (honest: we only know assets).
  const valuations = db
    .select({
      valuedAt: tables.assetValuations.valuedAt,
      valueCents: tables.assetValuations.valueCents,
    })
    .from(tables.assetValuations)
    .orderBy(asc(tables.assetValuations.valuedAt))
    .all();

  return valuations.map((v) => ({
    at: v.valuedAt,
    assetsCents: v.valueCents,
    debtsCents: 0,
    netCents: v.valueCents,
  }));
}
