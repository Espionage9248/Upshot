import type { ReactNode } from "react";
import { TopBar } from "@/components/top-bar";
import { getDb } from "@/lib/db";
import { LedgerView } from "@/components/analyse/two-up/ledger-view";
import { loadTwoUpLedger } from "./data";

export const dynamic = "force-dynamic";

export default function TwoUpLedgerPage(): ReactNode {
  const { db } = getDb();
  return (
    <>
      <TopBar title="2Up · Transactions" sub="SEARCHABLE · READ-ONLY" />
      <LedgerView txns={loadTwoUpLedger(db)} />
    </>
  );
}
