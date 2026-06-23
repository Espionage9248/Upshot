import type { ReactNode } from "react";
import { tables, DrizzleCategoryRepo, DrizzleDebtRepo, DrizzleRecurringRepo, DrizzleInstallmentRepo } from "@upshot/db";
import { getDb } from "@/lib/db";
import { listRules } from "@/server-actions/rules-core";
import { RuleList } from "@/components/settings/rule-builder/rule-list";

// Reads the encrypted DB at request time, so this route must never be
// statically prerendered (mirrors settings/page.tsx).
export const dynamic = "force-dynamic";

export default async function RulesPage(): Promise<ReactNode> {
  const { db } = getDb();
  const rules = await listRules(db);

  const categories = await new DrizzleCategoryRepo(db).list();
  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));
  const tagRows = db.select({ id: tables.tags.id }).from(tables.tags).all();
  const tagOptions = tagRows.map((t) => ({ value: t.id, label: t.id }));

  const debtOptions = (await new DrizzleDebtRepo(db).list()).map((d) => ({ value: d.id, label: d.name }));
  const recurringOptions = (await new DrizzleRecurringRepo(db).list()).map((i) => ({ value: i.id, label: i.name }));
  const installmentOptions = (await new DrizzleInstallmentRepo(db).list()).map((p) => ({ value: p.id, label: p.merchant }));

  return (
    <>
      <div>
        <div style={{ fontSize: 17, fontWeight: 700 }}>Rules</div>
        <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 3 }}>
          Auto-rename, tag, or categorise transactions as they arrive.
        </div>
      </div>

      <RuleList
        rules={rules}
        categoryOptions={categoryOptions}
        tagOptions={tagOptions}
        debtOptions={debtOptions}
        recurringOptions={recurringOptions}
        installmentOptions={installmentOptions}
      />
    </>
  );
}
