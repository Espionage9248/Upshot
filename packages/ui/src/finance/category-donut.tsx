"use client";

import type { ReactElement } from "react";
import { EmptyState } from "./empty-state";
import { Money } from "./money";

export interface CategoryDonutProps {
  slices: Array<{ label: string; valueCents: number }>;
  w?: number;
}

// Design spec: ordered --viz-1…7; past 7 → group tail as "Other"
const VIZ_COLORS = [
  "var(--viz-1)",
  "var(--viz-2)",
  "var(--viz-3)",
  "var(--viz-4)",
  "var(--viz-5)",
  "var(--viz-6)",
  "var(--viz-7)",
];

/**
 * CategoryDonut — donut chart ordered --viz-1…7 by share, centre shows total,
 * always legended. Design ref: §"Category breakdown — Donut/bars".
 * Ring geometry mirrors design_handoff_upshot/build/charts.jsx Donut.
 * Client component; serializable cents props only.
 */
export function CategoryDonut({ slices, w = 260 }: CategoryDonutProps): ReactElement {
  if (slices.length === 0) {
    return (
      <EmptyState
        icon="tag"
        title="No categories yet"
        hint="Category breakdown appears once transactions are categorised."
      />
    );
  }

  // Sort descending by value, group beyond 7 into "Other"
  const sorted = [...slices].sort((a, b) => b.valueCents - a.valueCents);
  const top = sorted.slice(0, 7);
  const rest = sorted.slice(7);
  const otherCents = rest.reduce((s, r) => s + r.valueCents, 0);
  const segments =
    otherCents > 0
      ? [...top, { label: "Other", valueCents: otherCents }]
      : top;

  const totalCents = segments.reduce((s, seg) => s + seg.valueCents, 0);

  // Ring geometry (mirrors charts.jsx Donut)
  const size = w;
  const thickness = Math.max(14, size * 0.12);
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;

  // Build arc segments
  let accumulated = 0;
  const arcs = segments.map((seg, i) => {
    const share = totalCents > 0 ? seg.valueCents / totalCents : 0;
    const len = share * circumference;
    const offset = -accumulated;
    accumulated += len;
    return { ...seg, len, offset, color: VIZ_COLORS[i % VIZ_COLORS.length]! };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
      {/* Donut SVG */}
      <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label="Category breakdown donut chart"
          style={{ transform: "rotate(-90deg)", display: "block" }}
        >
          {/* Track */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="var(--surface-3)"
            strokeWidth={thickness}
          />
          {arcs.map((arc, i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={arc.color}
              strokeWidth={thickness}
              strokeDasharray={`${arc.len} ${circumference - arc.len}`}
              strokeDashoffset={arc.offset}
            />
          ))}
        </svg>

        {/* Centre total */}
        <div
          data-testid="donut-total"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{ fontSize: 10, color: "var(--text-3)", fontWeight: 600, marginBottom: 2 }}
          >
            Total
          </div>
          <Money cents={totalCents} kind="neutral" size={13} weight={700} showCents={false} />
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          width: "100%",
          maxWidth: size,
        }}
      >
        {arcs.map((arc, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              justifyContent: "space-between",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 3,
                  background: arc.color,
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 12, color: "var(--text-2)" }}>{arc.label}</span>
            </span>
            <Money cents={arc.valueCents} kind="neutral" size={12} weight={600} showCents={false} />
          </div>
        ))}
      </div>
    </div>
  );
}
