import type { ReactNode } from "react";
import { TopBar } from "@/components/top-bar";
import { getDb } from "@/lib/db";
import { ForecastPanel } from "@/components/analyse/forecast-panel";
import { loadForecastData } from "./data";

// The DB client is constructed from env at request time, so this route must
// never be statically prerendered.
export const dynamic = "force-dynamic";

/** Next 16 passes searchParams as a Promise of string | string[] | undefined. */
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** First scalar value of a (possibly array) search param. */
function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

const VALID_HORIZONS = [30, 60, 90] as const;

export default async function ForecastPage({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<ReactNode> {
  const { db } = getDb();
  const sp = await searchParams;

  // ?h → 30 | 60 | 90 (default 90)
  const hParam = one(sp.h);
  const hParsed = hParam !== undefined ? Number.parseInt(hParam, 10) : 90;
  const horizon: 30 | 60 | 90 = VALID_HORIZONS.includes(hParsed as 30 | 60 | 90)
    ? (hParsed as 30 | 60 | 90)
    : 90;

  const data = await loadForecastData(db, {
    now: new Date().toISOString(),
    horizon,
  });

  return (
    <>
      <TopBar title="Forecast" sub="30/60/90-DAY CASH-FLOW · WHAT-IF" />
      <ForecastPanel forecast={data.forecast} horizon={horizon} />
    </>
  );
}
