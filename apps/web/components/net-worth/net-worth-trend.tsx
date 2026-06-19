"use client";

import { Money, EmptyState } from "@upshot/ui";
import type { TrendPoint } from "@/app/(app)/net-worth/data";

export interface NetWorthTrendProps {
  series: TrendPoint[];
  w?: number;
  h?: number;
}

/**
 * Net-worth trend SVG — mirrors design_handoff_upshot/build/charts.jsx
 * NetWorthTrend, but driven by the REAL `series` (integer-cents per point):
 * assets area up from a baseline (--saved), debts area down (--debt), net line
 * (--coral) with an end dot. Client component — serializable props only, never
 * imports @upshot/db. Empty series → EmptyState (per spec §Empty).
 */
export function NetWorthTrend({ series, w = 540, h = 220 }: NetWorthTrendProps) {
  if (series.length === 0) {
    return (
      <EmptyState
        icon="trend"
        title="No trend yet"
        hint="Your net-worth history builds up as monthly snapshots and asset valuations accrue."
      />
    );
  }

  // Work in dollars for scale stability (cents → dollars; pure presentation).
  const assets = series.map((p) => p.assetsCents / 100);
  const debts = series.map((p) => p.debtsCents / 100);
  const net = series.map((p) => p.netCents / 100);
  const last = series[series.length - 1]!;

  const n = series.length;
  const padX = 4;
  const X = (i: number) => padX + (n === 1 ? 0.5 : i / (n - 1)) * (w - padX * 2);
  const mid = h * 0.62; // baseline for the assets/debts split
  // Both assets and debts scale on the assets max (mirrors charts.jsx) so the
  // debt band reads proportionally against assets rather than always filling.
  const maxA = Math.max(...assets, 1) * 1.05;
  const aY = (v: number) => mid - (v / maxA) * (mid - 10);
  const dY = (v: number) => mid + (v / maxA) * (h - mid - 24);
  const nMax = Math.max(...net);
  const nMin = Math.min(...net);
  const nY = (v: number) => mid - ((v - nMin) / (nMax - nMin || 1)) * (mid - 14) - 2;

  const line = (pts: number[], yf: (v: number) => number) =>
    pts.map((p, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${yf(p).toFixed(1)}`).join(" ");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <svg
        width="100%"
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label="Net worth trend: assets, debts and net over time"
        style={{ display: "block", overflow: "visible" }}
      >
        <line x1={0} x2={w} y1={mid} y2={mid} stroke="var(--line)" strokeWidth={1} />
        {/* assets area + line (up from baseline) */}
        <path
          d={`${line(assets, aY)} L${X(n - 1).toFixed(1)} ${mid} L${X(0).toFixed(1)} ${mid} Z`}
          fill="var(--saved)"
          opacity={0.16}
        />
        <path d={line(assets, aY)} fill="none" stroke="var(--saved)" strokeWidth={2} />
        {/* debts area + line (down from baseline) */}
        <path
          d={`${line(debts, dY)} L${X(n - 1).toFixed(1)} ${mid} L${X(0).toFixed(1)} ${mid} Z`}
          fill="var(--debt)"
          opacity={0.16}
        />
        <path d={line(debts, dY)} fill="none" stroke="var(--debt)" strokeWidth={2} />
        {/* net line (coral) + end dot */}
        <path d={line(net, nY)} fill="none" stroke="var(--coral)" strokeWidth={2.6} strokeLinecap="round" />
        <circle
          cx={X(n - 1)}
          cy={nY(net[n - 1]!)}
          r={3.5}
          fill="var(--coral)"
          stroke="var(--bg)"
          strokeWidth={2}
        />
      </svg>

      {/* legend footer — three series with their latest totals */}
      <div style={{ display: "flex", gap: 24 }}>
        <LegendItem swatch="var(--saved)" label="Assets">
          <Money cents={last.assetsCents} kind="neutral" size={13} weight={600} showCents={false} />
        </LegendItem>
        <LegendItem swatch="var(--debt)" label="Debts">
          <Money cents={last.debtsCents} kind="neutral" size={13} weight={600} showCents={false} />
        </LegendItem>
        <LegendItem swatch="var(--coral)" label="Net">
          <Money cents={last.netCents} kind="neutral" size={13} weight={600} showCents={false} />
        </LegendItem>
      </div>
    </div>
  );
}

function LegendItem({
  swatch,
  label,
  children,
}: {
  swatch: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11,
          fontWeight: 600,
          color: "var(--text-3)",
        }}
      >
        <span
          style={{ width: 8, height: 8, borderRadius: 3, background: swatch, display: "inline-block" }}
        />
        {label}
      </span>
      {children}
    </div>
  );
}
