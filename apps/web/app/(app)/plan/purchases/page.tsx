import type { ReactNode } from "react";
import { TopBar } from "@/components/top-bar";
import { PurchaseList } from "@/components/plan/purchase-list";
import { getDb } from "@/lib/db";
import { loadPurchasesData } from "./data";

// The DB client is constructed from env at request time.
export const dynamic = "force-dynamic";

export default async function PurchasesPage(): Promise<ReactNode> {
  const { db } = getDb();
  const data = await loadPurchasesData(db);

  return (
    <>
      <TopBar title="Purchases" sub="WISHLIST" />
      <PurchaseList data={data} />
    </>
  );
}
