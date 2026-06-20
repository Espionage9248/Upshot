import type { ReactNode } from "react";
import { TopBar } from "@/components/top-bar";
import { DebtList } from "@/components/plan/debt-list";
import { getDb } from "@/lib/db";
import { loadDebtsData } from "./data";

// The DB client is constructed from env at request time.
export const dynamic = "force-dynamic";

export default async function DebtsPage(): Promise<ReactNode> {
  const { db } = getDb();
  const data = await loadDebtsData(db);

  return (
    <>
      <TopBar title="Debts" sub="PAYOFF TRACKER" />
      <DebtList data={data} />
    </>
  );
}
