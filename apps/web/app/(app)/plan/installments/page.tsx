import type { ReactNode } from "react";
import { TopBar } from "@/components/top-bar";
import { InstallmentList } from "@/components/plan/installment-list";
import { getDb } from "@/lib/db";
import { loadInstallmentsData } from "./data";

// The DB client is constructed from env at request time.
export const dynamic = "force-dynamic";

export default async function InstallmentsPage(): Promise<ReactNode> {
  const { db } = getDb();
  const data = await loadInstallmentsData(db);

  return (
    <>
      <TopBar title="BNPL" sub="INSTALLMENT PLANS" />
      <InstallmentList data={data} />
    </>
  );
}
