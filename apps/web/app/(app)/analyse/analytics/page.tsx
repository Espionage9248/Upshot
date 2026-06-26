import type { ReactNode } from "react";
import { TopBar } from "@/components/top-bar";
import { getDb } from "@/lib/db";
import { AnalyticsView } from "@/components/analyse/analytics-view";
import { loadAnalyticsData } from "./data";

// The DB client is constructed from env at request time, so this route must
// never be statically prerendered (mirrors analyse/page.tsx, net-worth/page.tsx).
export const dynamic = "force-dynamic";

export default async function AnalyticsPage(): Promise<ReactNode> {
  const { db } = getDb();

  const data = await loadAnalyticsData(db, {
    now: new Date().toISOString(),
  });

  return (
    <>
      <TopBar title="Analytics" sub="BUDGET HEALTH · PATTERNS · BEHAVIOURAL INSIGHTS" />
      <AnalyticsView data={data} />
    </>
  );
}
