import type { ReactElement } from "react";
import { Money } from "@upshot/ui";

export function CatTotals({
  rows,
  maxCents,
}: {
  rows: { category: string; cents: number; count: number }[];
  maxCents: number;
}): ReactElement {
  return (
    <div>
      {rows.map((row) => {
        const pct = maxCents > 0 ? Math.max(2, (Math.abs(row.cents) / maxCents) * 100) : 2;
        return (
          <div
            key={row.category}
            style={{
              display: "grid",
              gridTemplateColumns: "120px 1fr 90px",
              gap: 14,
              alignItems: "center",
              padding: "11px 0",
              borderBottom: "1px solid var(--line-soft)",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600 }}>{row.category}</span>
            <div
              style={{
                height: 12,
                borderRadius: 6,
                overflow: "hidden",
                background: "var(--surface-3)",
              }}
            >
              <div
                style={{
                  width: pct + "%",
                  height: "100%",
                  background: "var(--expense)",
                  borderRadius: 6,
                }}
              />
            </div>
            <div style={{ textAlign: "right" }}>
              <Money cents={row.cents} kind="expense" size={12.5} weight={700} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
