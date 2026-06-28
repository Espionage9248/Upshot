import type { ReactNode } from "react";
import { TopBar } from "@/components/top-bar";
import { getDb } from "@/lib/db";
import { TaxView } from "@/components/analyse/tax-view";
import { loadTaxData } from "./data";

// The DB client is constructed from env at request time, so this route must
// never be statically prerendered.
export const dynamic = "force-dynamic";

export default async function TaxPage(): Promise<ReactNode> {
  const { db } = getDb();
  const data = await loadTaxData(db, { now: new Date().toISOString() });
  return (
    <>
      <TopBar title="Tax" sub="DEDUCTIBLES · ESTIMATED REFUND" />
      <TaxView data={data} />
    </>
  );
}
