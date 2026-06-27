"use client";

import type { ReactElement } from "react";
import { EmptyState } from "./empty-state";
import { Money } from "./money";

export interface ForecastChartProps {
  actual: Array<{ dateISO: string; balanceCents: number }>;
  projected: Array<{
    dateISO: string;
    centralCents: number;
    lowCents: number;
    highCents: number;
  }>;
  overdraftRisk: boolean;
  lowestProjectedCents: number;
  lowestDateISO: string;
  w?: number; // default 540
  h?: number; // default 220
}

/**
 * ForecastChart — account balance actual line + projected tail with confidence band.
 * Design ref: design_handoff_upshot §Cashflow/Forecast (Phase 6.2).
 * Actual line = solid --viz-1; projected tail = dashed --viz-1; confidence band = color-mix fill.
 * "Today" divider at actual→projected boundary; overdraft callout when overdraftRisk.
 * Client component; serializable cents props only.
 */
export function ForecastChart({
  actual,
  projected,
  overdraftRisk,
  lowestProjectedCents,
  lowestDateISO,
  w = 540,
  h = 220,
}: ForecastChartProps): ReactElement {
  if (projected.length === 0) {
    return (
      <EmptyState
        icon="trend"
        title="No forecast yet"
        hint="Forecast will appear once account data is available."
      />
    );
  }

  const padX = 12;
  const padY = 14;
  const chartW = w - padX * 2;
  const chartH = h - padY * 2 - 18; // 18 for bottom label space

  // Build combined chronological data points with an index-to-x mapping
  const allDates: string[] = [
    ...actual.map((p) => p.dateISO),
    ...projected.map((p) => p.dateISO),
  ];

  const n = allDates.length;
  const slotW = chartW / Math.max(n - 1, 1);

  const X = (i: number) => padX + i * slotW;

  // y-scale: cover min(low) to max(high), always include 0
  const allVals = [
    ...actual.map((p) => p.balanceCents / 100),
    ...projected.flatMap((p) => [p.centralCents / 100, p.lowCents / 100, p.highCents / 100]),
    0,
  ];
  const minVal = Math.min(...allVals);
  const maxVal = Math.max(...allVals);
  const range = maxVal - minVal || 1;

  const Y = (v: number) => padY + chartH - ((v - minVal) / range) * chartH;

  // Index where projected starts (= length of actual)
  const splitIdx = actual.length;

  // Build path strings
  const actualPath = actual
    .map((p, i) => `${i === 0 ? "M" : "L"}${X(i).toFixed(1)} ${Y(p.balanceCents / 100).toFixed(1)}`)
    .join(" ");

  // Connect last actual point to first projected central for continuity
  const projectedPathParts: string[] = [];
  if (actual.length > 0) {
    const lastActual = actual[actual.length - 1]!;
    projectedPathParts.push(
      `M${X(splitIdx - 1).toFixed(1)} ${Y(lastActual.balanceCents / 100).toFixed(1)}`,
    );
  }
  projected.forEach((p, i) => {
    const xi = X(splitIdx + i);
    const yi = Y(p.centralCents / 100);
    projectedPathParts.push(`${projectedPathParts.length === 0 ? "M" : "L"}${xi.toFixed(1)} ${yi.toFixed(1)}`);
  });
  const projectedPath = projectedPathParts.join(" ");

  // Confidence band: trace high forward, low back (closed polygon)
  const bandForward = projected.map((p, i) => {
    const xi = X(splitIdx + i);
    const yi = Y(p.highCents / 100);
    return `${i === 0 ? "M" : "L"}${xi.toFixed(1)} ${yi.toFixed(1)}`;
  });
  const bandBack = [...projected]
    .reverse()
    .map((p, i) => `L${X(splitIdx + (projected.length - 1 - i)).toFixed(1)} ${Y(p.lowCents / 100).toFixed(1)}`);
  const bandPath = [...bandForward, ...bandBack, "Z"].join(" ");

  // "Today" divider x
  const todayX = X(splitIdx > 0 ? splitIdx - 1 : 0);

  // Zero baseline y (only if 0 is within range)
  const zeroY = Y(0);
  const showZeroLine = 0 >= minVal && 0 <= maxVal;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <svg
        width="100%"
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label="Account balance forecast: actual history with projected trend and confidence band"
        style={{ display: "block", overflow: "visible" }}
      >
        {/* Zero baseline */}
        {showZeroLine && (
          <line
            x1={padX}
            x2={w - padX}
            y1={zeroY}
            y2={zeroY}
            stroke="var(--line)"
            strokeWidth={1}
            strokeDasharray="2 3"
          />
        )}

        {/* Confidence band (filled, no stroke) */}
        {projected.length > 1 && (
          <path
            d={bandPath}
            fill="color-mix(in oklch, var(--viz-1) 12%, transparent)"
            stroke="none"
          />
        )}

        {/* Actual line (solid) */}
        {actual.length > 0 && (
          <path
            d={actualPath}
            fill="none"
            stroke="var(--viz-1)"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Projected tail (dashed, same hue) */}
        {projected.length > 0 && projectedPathParts.length > 0 && (
          <path
            d={projectedPath}
            fill="none"
            stroke="var(--viz-1)"
            strokeWidth={2.2}
            strokeDasharray="4 3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Today divider */}
        {splitIdx > 0 && (
          <>
            <line
              x1={todayX}
              x2={todayX}
              y1={padY}
              y2={padY + chartH}
              stroke="var(--line)"
              strokeWidth={1}
            />
            <text
              x={todayX + 3}
              y={padY + 9}
              fontSize={9}
              fill="var(--text-3)"
            >
              Today
            </text>
          </>
        )}
      </svg>

      {/* Overdraft callout */}
      {overdraftRisk && (
        <div
          style={{
            padding: "8px 12px",
            borderRadius: "var(--radius-data, 6px)",
            background: "color-mix(in oklch, var(--warn) 10%, transparent)",
            border: "1px solid color-mix(in oklch, var(--warn) 30%, transparent)",
            color: "var(--warn)",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span>Overdraft risk on {lowestDateISO} — lowest projected:</span>
          <Money cents={lowestProjectedCents} kind="projected" size={12} weight={600} />
        </div>
      )}
    </div>
  );
}
