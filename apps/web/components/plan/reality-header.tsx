"use client";

import type { ReactElement } from "react";
import { UIcon } from "@upshot/ui";

export function RealityHeader({
  mode,
  name,
  dirty,
}: {
  mode: "hypothesis" | "locked-edit";
  name: string;
  dirty: boolean;
}): ReactElement {
  const isHyp = mode === "hypothesis";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      {isHyp ? (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 12px 6px 10px",
            borderRadius: 999,
            border: "1.5px dashed color-mix(in oklch, var(--coral) 50%, transparent)",
            background: "var(--coral-dim)",
            color: "var(--coral-text)",
            fontSize: 12.5,
            fontWeight: 700,
          }}
        >
          <UIcon name="sparkle" size={14} /> What-if · not committed
        </span>
      ) : (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 12px 6px 10px",
            borderRadius: 999,
            background: "var(--coral)",
            color: "var(--on-coral)",
            fontSize: 12.5,
            fontWeight: 700,
          }}
        >
          <UIcon name="lock" size={14} active /> Editing your tracked plan
        </span>
      )}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 700, whiteSpace: "nowrap" }}>{name}</span>
          {dirty && (
            <span
              style={{ width: 6, height: 6, borderRadius: 999, background: "var(--coral)" }}
              title="Unsaved changes"
            />
          )}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>
          {isHyp
            ? "Play freely — nothing changes until you save or lock"
            : "Changes update what Upshot tracks you against"}
        </div>
      </div>
    </div>
  );
}
