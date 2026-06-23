import type { ReactNode } from "react";
import { TopBar } from "@/components/top-bar";
import { RecurringList } from "@/components/plan/recurring-list";
import { getDb } from "@/lib/db";
import { loadRecurringData } from "./data";

// The DB client is constructed from env at request time.
export const dynamic = "force-dynamic";

export default async function RecurringPage(): Promise<ReactNode> {
  const { db } = getDb();
  const data = await loadRecurringData(db);

  return (
    <>
      <TopBar title="Recurring" sub="SUBSCRIPTIONS & BILLS" />
      <RecurringList data={data} />
    </>
  );
}
