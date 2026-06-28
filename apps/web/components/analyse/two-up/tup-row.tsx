import type { ReactElement } from "react";
import { Money } from "@upshot/ui";
import type { TwoUpTxn } from "@upshot/core";
import { extractMerchant } from "@upshot/core";
import { Avatar } from "./avatar";
import { MarkOwnerControl } from "./mark-owner-control";

// Person identity colours — James = viz-2, Britt = viz-4
const OWNER_COLOR: Record<string, string> = {
  JAMES: "var(--viz-2)",
  BRITTNEY: "var(--viz-4)",
  SHARED: "var(--text-3)",
  UNASSIGNED: "var(--text-3)",
  INTEREST: "var(--text-3)",
  REVERSAL: "var(--text-3)",
};

const OWNER_LABEL: Record<string, string> = {
  JAMES: "James",
  BRITTNEY: "Britt",
  SHARED: "Shared",
  UNASSIGNED: "Unassigned",
  INTEREST: "Interest",
  REVERSAL: "Reversal",
};

export function TUpRow({
  txn,
  onSaved,
}: {
  txn: TwoUpTxn;
  onSaved?: () => void;
}): ReactElement {
  const merchant = extractMerchant(txn.description);
  const kind = txn.amountCents >= 0 ? "income" : "expense";
  const color = OWNER_COLOR[txn.owner] ?? "var(--text-3)";
  const label = OWNER_LABEL[txn.owner] ?? txn.owner;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "120px 1.6fr 1fr 0.9fr auto",
        gap: 14,
        alignItems: "center",
        padding: "12px 18px",
        borderBottom: "1px solid var(--line-soft)",
      }}
    >
      {/* Person */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Avatar name={label} color={color} size={24} />
        <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
      </div>

      {/* Merchant + note */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {merchant}
        </div>
        {txn.description !== merchant && (
          <div style={{ fontSize: 11, color: "var(--text-3)" }}>{txn.description}</div>
        )}
      </div>

      {/* Category dot */}
      <div>
        {txn.category ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11.5,
              color: "var(--text-2)",
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: 999,
                background: "var(--text-3)",
                flexShrink: 0,
              }}
            />
            {txn.category}
          </span>
        ) : (
          <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>—</span>
        )}
      </div>

      {/* Date */}
      <div
        className="tnum"
        style={{
          fontSize: 11.5,
          color: "var(--text-3)",
          fontFamily: "var(--font-mono)",
        }}
      >
        {txn.date}
      </div>

      {/* Amount + mark control */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          justifyContent: "flex-end",
        }}
      >
        <Money cents={txn.amountCents} kind={kind} size={13.5} weight={700} />
        <MarkOwnerControl id={txn.id} owner={txn.owner} category={txn.category} onSaved={onSaved} />
      </div>
    </div>
  );
}
