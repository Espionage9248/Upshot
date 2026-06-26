import type { ReactNode } from "react";
import { TopBar } from "@/components/top-bar";
import { getDb } from "@/lib/db";
import { ReportsView } from "@/components/analyse/reports-view";
import { loadReportsData, type ReportView } from "./data";

// The DB client is constructed from env at request time, so this route must
// never be statically prerendered (mirrors net-worth/page.tsx, money/page.tsx).
export const dynamic = "force-dynamic";

/** Next 16 passes searchParams as a Promise of string | string[] | undefined. */
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** First scalar value of a (possibly array) search param. */
function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

const VALID_VIEWS: ReportView[] = ["month", "year", "fy"];

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

  const rawView = one(sp.view);
  const view: ReportView = VALID_VIEWS.includes(rawView as ReportView)
    ? (rawView as ReportView)
    : "month";

  const yearParam = one(sp.year);
  const parsedYear =
    yearParam !== undefined ? Number.parseInt(yearParam, 10) : undefined;
  const year =
    parsedYear !== undefined && Number.isFinite(parsedYear) && parsedYear > 2000
      ? parsedYear
      : undefined;

  const data = await loadReportsData(db, {
    periodIndex,
    now: new Date().toISOString(),
    view,
    year,
  });

  const subLine =
    view === "year"
      ? "YEARLY INCOME · SPENDING · TRENDS"
      : view === "fy"
        ? "FINANCIAL YEAR · INCOME · SPENDING · TRENDS"
        : "PAY-PERIOD INCOME · SPENDING · SAVING";

  return (
    <>
      <TopBar title="Reports" sub={subLine} />
      <ReportsView data={data} />
    </>
  );
}
