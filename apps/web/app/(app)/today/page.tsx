import type { ReactNode } from "react";
import { TopBar } from "@/components/top-bar";
import { DashCalm } from "@/components/dash/dash-calm";
import { getDb } from "@/lib/db";
import { loadTodayData } from "./data";

// The DB client is constructed from env at request time (getDb → createDbClientFromEnv
// throws without DB_ENCRYPTION_KEY), so this route must never be statically
// prerendered. The (app) layout already forces dynamic via requireSession(),
// but we pin it here too to keep the env-free `next build` invariant explicit.
export const dynamic = "force-dynamic";

export default async function TodayPage(): Promise<ReactNode> {
  const { db } = getDb();
  const data = await loadTodayData(db);

  return (
    <>
      <TopBar title="Today" sub="DASHBOARD" health={data.syncHealth} />
      <DashCalm data={data} />
    </>
  );
}
