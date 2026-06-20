import type { ReactNode } from "react";
import { getDb } from "@/lib/db";
import { loadSavers } from "@/server-actions/savers-core";
import { BudgetSettings } from "@/components/settings/budget-settings";

// Reads the encrypted DB at request time, so this route must never be
// statically prerendered (mirrors settings/tax/page.tsx).
export const dynamic = "force-dynamic";

export default async function BudgetPage(): Promise<ReactNode> {
  const { db } = getDb();
  const savers = await loadSavers(db);

  return (
    <>
      <div>
        <div style={{ fontSize: 17, fontWeight: 700 }}>Budgeting &amp; goals</div>
        <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 3 }}>
          Set a target amount and date for each saver to track progress toward your goals.
        </div>
      </div>

      <BudgetSettings savers={savers} />
    </>
  );
}
