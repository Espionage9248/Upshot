import type { ReactNode } from "react";
import { TopBar } from "@/components/top-bar";
import { getDb } from "@/lib/db";
import { OverviewView } from "@/components/analyse/two-up/overview-view";
import { loadTwoUpOverview } from "./data";

// The DB client is constructed from env at request time, so this route must
// never be statically prerendered.
export const dynamic = "force-dynamic";

export default function TwoUpPage(): ReactNode {
  const { db } = getDb();
  return (
    <>
      <TopBar title="2Up" sub="JOINT ACCOUNT · HISTORICAL · READ-ONLY" />
      <OverviewView data={loadTwoUpOverview(db)} />
    </>
  );
}
