import type { ReactElement } from "react";
import { Money } from "@upshot/ui";
import { Avatar } from "./avatar";

function VBar({ v, max, color }: { v: number; max: number; color: string }): ReactElement {
  const pct = max > 0 ? Math.max(2, (Math.abs(v) / max) * 100) : 2;
  return (
    <div
      style={{
        height: 7,
        borderRadius: 999,
        background: "var(--surface-3)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: pct + "%",
          height: "100%",
          borderRadius: 999,
          background: color,
        }}
      />
    </div>
  );
}

export function ContributorPanel({
  name,
  color,
  putInCents,
  shareOfCostsCents,
  netCents,
  maxCents,
}: {
  name: string;
  color: string;
  putInCents: number;
  shareOfCostsCents: number;
  netCents: number;
  maxCents: number;
}): ReactElement {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
        <Avatar name={name} color={color} size={30} />
        <span style={{ fontSize: 15, fontWeight: 700 }}>{name}</span>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 5,
          }}
        >
          <span style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 600 }}>Put in</span>
          <Money cents={putInCents} kind="income" size={13.5} weight={700} />
        </div>
        <VBar v={putInCents} max={maxCents} color="var(--income)" />
      </div>

      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 5,
          }}
        >
          <span style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 600 }}>
            Share of costs
          </span>
          <Money cents={shareOfCostsCents} kind="expense" size={13.5} weight={700} />
        </div>
        <VBar v={shareOfCostsCents} max={maxCents} color="var(--expense)" />
      </div>

      <div
        style={{
          paddingTop: 11,
          borderTop: "1px solid var(--line-soft)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <span style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 600 }}>Net</span>
        <Money
          cents={netCents}
          kind={netCents >= 0 ? "income" : "expense"}
          size={14}
          weight={700}
        />
      </div>
    </div>
  );
}
