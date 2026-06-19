import type { ReactNode } from "react";
import { inArray } from "drizzle-orm";
import { tables, DrizzleAccountRepo, DrizzleCategoryRepo } from "@upshot/db";
import { TopBar } from "@/components/top-bar";
import { getDb } from "@/lib/db";
import { LedgerFilters } from "@/components/money/ledger-filters";
import { LedgerTable } from "@/components/money/ledger-table";
import { loadLedger, type LedgerFilters as LedgerFilterValues } from "./data";

// The DB client is constructed from env at request time, so this route must
// never be statically prerendered (mirrors today/page.tsx).
export const dynamic = "force-dynamic";

/** Next 16 passes searchParams as a Promise of string | string[] | undefined. */
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** First scalar value of a (possibly array) search param. */
function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** Build the typed LedgerFilters from the URL search params. */
function toFilters(sp: Record<string, string | string[] | undefined>): LedgerFilterValues {
  const account = one(sp.account);
  const status = one(sp.status);
  const category = one(sp.category);
  const tag = one(sp.tag);
  const q = one(sp.q);
  return {
    accountId: account,
    status: status === "HELD" || status === "SETTLED" ? status : undefined,
    categoryId: category,
    tagId: tag,
    isSalary: one(sp.salary) === "1" ? true : undefined,
    isTransfer: one(sp.transfer) === "1" ? true : undefined,
    isInterest: one(sp.interest) === "1" ? true : undefined,
    isTaxDeductible: one(sp.deductible) === "1" ? true : undefined,
    q: q && q.length > 0 ? q : undefined,
  };
}

/** Flatten the search params to plain strings for pagination-link preservation. */
function flatParams(sp: Record<string, string | string[] | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    const s = one(v);
    if (s !== undefined && k !== "page") out[k] = s;
  }
  return out;
}

export default async function MoneyPage({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<ReactNode> {
  const { db } = getDb();
  const sp = await searchParams;

  const filters = toFilters(sp);
  const page = Math.max(0, Number.parseInt(one(sp.page) ?? "0", 10) || 0);

  const result = await loadLedger(db, filters, page);

  // Lightweight option lists the filters + row popover need.
  const accounts = await new DrizzleAccountRepo(db).list();
  const categories = await new DrizzleCategoryRepo(db).list();
  const tagRows = db.select({ id: tables.tags.id }).from(tables.tags).all();

  const accountOptions = accounts.map((a) => ({ value: a.id, label: a.name }));
  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));
  const tagOptions = tagRows.map((t) => ({ value: t.id, label: t.id }));
  const categoryNames = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  // Per-row tag ids for just the transactions on this page.
  const txIds = result.rows.map((r) => r.id);
  const rowTagIds: Record<string, string[]> = {};
  if (txIds.length > 0) {
    const links = db
      .select({
        transactionId: tables.transactionTags.transactionId,
        tagId: tables.transactionTags.tagId,
      })
      .from(tables.transactionTags)
      .where(inArray(tables.transactionTags.transactionId, txIds))
      .all();
    for (const link of links) {
      (rowTagIds[link.transactionId] ??= []).push(link.tagId);
    }
  }

  return (
    <>
      <TopBar title="Money" sub="LEDGER" />
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <LedgerFilters
          accountOptions={accountOptions}
          categoryOptions={categoryOptions}
          tagOptions={tagOptions}
        />
        <LedgerTable
          rows={result.rows}
          total={result.total}
          page={page}
          hasNext={result.hasNext}
          categoryNames={categoryNames}
          rowTagIds={rowTagIds}
          searchParams={flatParams(sp)}
          categoryOptions={categoryOptions}
          tagOptions={tagOptions}
        />
      </div>
    </>
  );
}
