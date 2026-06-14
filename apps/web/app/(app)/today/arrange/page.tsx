import type { ReactNode } from "react";
import { TopBar } from "@/components/top-bar";
import { DashEdit } from "@/components/dash/dash-edit";
import { defaultLayout } from "@/components/dash/dash-layout";
import { getDb } from "@/lib/db";
import { loadLayout } from "@/server-actions/dashboard-core";

// Touches the DB at request time (getDb → createDbClientFromEnv throws without
// DB_ENCRYPTION_KEY), so this route must never be statically prerendered — keeps
// the env-free `next build` invariant explicit.
export const dynamic = "force-dynamic";

export default async function ArrangePage(): Promise<ReactNode> {
  const { db } = getDb();
  const saved = await loadLayout(db);
  const initial = saved.length > 0 ? saved : defaultLayout();

  return (
    <>
      <TopBar title="Arrange dashboard" sub="TODAY" />
      <DashEdit initial={initial} />
    </>
  );
}
