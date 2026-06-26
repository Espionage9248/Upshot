import type { ReactNode } from "react";
import { TopBar } from "@/components/top-bar";
import { getDb } from "@/lib/db";
import { ReportsView } from "@/components/analyse/reports-view";
import { loadReportsData } from "./data";

// The DB client is constructed from env at request time, so this route must
// never be statically prerendered (mirrors net-worth/page.tsx, money/page.tsx).
export const dynamic = "force-dynamic";

/** Next 16 passes searchParams as a Promise of string | string[] | undefined. */
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** First scalar value of a (possibly array) search param. */
function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AnalysePage({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<ReactNode> {
  const { db } = getDb();
  const sp = await searchParams;

  const periodParam = one(sp.period);
  const parsed = periodParam !== undefined ? Number.parseInt(periodParam, 10) : 0;
  const periodIndex = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;

  const data = await loadReportsData(db, {
    periodIndex,
    now: new Date().toISOString(),
  });

  return (
    <>
      <TopBar title="Reports" sub="PAY-PERIOD INCOME · SPENDING · SAVING" />
      <ReportsView data={data} />
    </>
  );
}
