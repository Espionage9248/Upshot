import type { ReactElement } from "react";
import Link from "next/link";
import { Money, type MoneyKind, Badge } from "@upshot/ui";
import type { TransactionRow } from "@/app/(app)/money/data";
import { TxFlags } from "./tx-flags";
import { RowEditPopover, type RowEditOption } from "./row-edit-popover";

export interface LedgerTableProps {
  rows: TransactionRow[];
  total: number;
  page: number;
  hasNext: boolean;
  /** Map of categoryId → display name for badge labels. */
  categoryNames: Record<string, string>;
  /** Map of transaction id → its active tag ids. */
  rowTagIds: Record<string, string[]>;
  /** Current URL search params (for pagination links that preserve filters). */
  searchParams: Record<string, string>;
  /** Category choices for the row edit popover. */
  categoryOptions: RowEditOption[];
  /** Tag choices for the row edit popover. */
  tagOptions: RowEditOption[];
}

/** Money kind for a transaction: transfers are neutral; sign decides income vs expense. */
function moneyKind(tx: TransactionRow): MoneyKind {
  if (tx.isTransfer) return "transfer";
  return tx.amountCents >= 0 ? "income" : "expense";
}

/**
 * The Ledger table — the workhorse row surface. Server-safe (no "use client"):
 * renders rows with signed Money (tnum), a category Badge + the row's tag
 * Badges, the flag chips, and a per-row inline-edit Popover (client). At 360px
 * the layout collapses to merchant + amount (the meta cells hide, no clip).
 */
export function LedgerTable({
  rows,
  total,
  page,
  hasNext,
  categoryNames,
  rowTagIds,
  searchParams,
  categoryOptions,
  tagOptions,
}: LedgerTableProps): ReactElement {
  if (rows.length === 0) {
    return (
      <p style={{ fontSize: 13, color: "var(--text-3)", padding: "24px 4px" }}>
        No transactions match these filters.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {rows.map((tx) => {
          const tags = rowTagIds[tx.id] ?? [];
          const catName = tx.categoryId ? categoryNames[tx.categoryId] : undefined;
          return (
            <div
              key={tx.id}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1.6fr) 1fr auto auto",
                alignItems: "center",
                gap: 10,
                padding: "10px 10px",
                borderBottom: "1px solid var(--line-soft)",
              }}
              className="ledger-row"
            >
              {/* merchant — always visible */}
              <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 999,
                    background: dotColor(moneyKind(tx)),
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {tx.description}
                </span>
              </div>

              {/* category + tags + flags — hidden at 360px */}
              <div className="ledger-meta" style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", minWidth: 0 }}>
                {catName && <Badge tone="neutral">{catName}</Badge>}
                {tags.map((t) => (
                  <Badge key={t} tone="neutral">
                    {t}
                  </Badge>
                ))}
                <TxFlags
                  isSalary={tx.isSalary}
                  isTransfer={tx.isTransfer}
                  isInterest={tx.isInterest}
                  isTaxDeductible={tx.isTaxDeductible}
                />
              </div>

              {/* amount — always visible */}
              <Money cents={tx.amountCents} kind={moneyKind(tx)} size={13} />

              {/* edit — hidden at 360px */}
              <span className="ledger-meta">
                <RowEditPopover
                  txId={tx.id}
                  categoryId={tx.categoryId}
                  categoryOptions={categoryOptions}
                  tagOptions={tagOptions}
                  activeTagIds={tags}
                  isSalary={tx.isSalary}
                  isTransfer={tx.isTransfer}
                  isTaxDeductible={tx.isTaxDeductible}
                />
              </span>
            </div>
          );
        })}
      </div>

      <Pager page={page} hasNext={hasNext} total={total} searchParams={searchParams} />
    </div>
  );
}

/** Category dot colour, mirroring the Money kind palette from the ds ref. */
function dotColor(kind: MoneyKind): string {
  if (kind === "income") return "var(--income)";
  if (kind === "transfer") return "var(--transfer)";
  return "var(--expense)";
}

function pageHref(searchParams: Record<string, string>, page: number): string {
  const params = new URLSearchParams(searchParams);
  if (page <= 0) params.delete("page");
  else params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/money?${qs}` : "/money";
}

function Pager({
  page,
  hasNext,
  total,
  searchParams,
}: {
  page: number;
  hasNext: boolean;
  total: number;
  searchParams: Record<string, string>;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>
        {total} transaction{total === 1 ? "" : "s"} · page {page + 1}
      </span>
      <div style={{ display: "flex", gap: 8 }}>
        <PagerLink
          href={pageHref(searchParams, page - 1)}
          disabled={page <= 0}
          label="Previous"
        />
        <PagerLink href={pageHref(searchParams, page + 1)} disabled={!hasNext} label="Next" />
      </div>
    </div>
  );
}

function PagerLink({ href, disabled, label }: { href: string; disabled: boolean; label: string }) {
  const style = {
    padding: "5px 11px",
    borderRadius: "var(--radius-data)",
    fontSize: 12.5,
    fontWeight: 600,
    border: "1px solid var(--line)",
    color: disabled ? "var(--text-3)" : "var(--text-2)",
    pointerEvents: disabled ? ("none" as const) : undefined,
    opacity: disabled ? 0.5 : 1,
  };
  if (disabled) {
    return <span style={style}>{label}</span>;
  }
  return (
    <Link href={href} style={style}>
      {label}
    </Link>
  );
}
