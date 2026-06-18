import type { ReactNode } from "react";
import { TopBar } from "@/components/top-bar";
import { BudgetBoard } from "@/components/budget/budget-board";
import { getDb } from "@/lib/db";
import { loadBudgetData } from "./data";

// The DB client is constructed from env at request time, so this route must
// never be statically prerendered. The (app) layout already forces dynamic via
// requireSession(); pinned here too to keep the env-free `next build` invariant
// explicit (mirrors today/page.tsx).
export const dynamic = "force-dynamic";

export default async function BudgetPage(): Promise<ReactNode> {
  const { db } = getDb();
  const data = await loadBudgetData(db);

  return (
    <>
      <TopBar title="Budget" sub="ENVELOPES & SAVERS" />
      <BudgetBoard data={data} />
    </>
  );
}
