import type { ReactNode } from "react";
import { TopBar } from "@/components/top-bar";
import { DebtDashboard } from "@/components/plan/debt-dashboard";
import { getDb } from "@/lib/db";
import { loadDebtsData } from "./data";
import { loadPlanningData } from "./planning-data";

// The DB client is constructed from env at request time.
export const dynamic = "force-dynamic";

export default async function DebtsPage(): Promise<ReactNode> {
  const { db } = getDb();
  const [data, planning] = await Promise.all([loadDebtsData(db), loadPlanningData(db)]);

  return (
    <>
      <TopBar title="Debts" sub="PAYOFF TRACKER" />
      <DebtDashboard data={data} planning={planning} />
    </>
  );
}
