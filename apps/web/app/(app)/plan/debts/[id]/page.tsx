import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/top-bar";
import { DebtDetail } from "@/components/plan/debt-detail";
import { getDb } from "@/lib/db";
import { loadDebtDetail } from "./data";

export const dynamic = "force-dynamic";

export default async function DebtDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<ReactNode> {
  const { id } = await params;
  const { db } = getDb();
  const data = await loadDebtDetail(db, id);

  if (!data) {
    notFound();
  }

  return (
    <>
      <TopBar title={data.debt.name} sub="DEBT DETAIL" />
      <div style={{ marginBottom: 8 }}>
        <Link
          href="/plan/debts"
          style={{
            fontSize: 12,
            color: "var(--text-3)",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          ← Back to debts
        </Link>
      </div>
      <DebtDetail data={data} />
    </>
  );
}
