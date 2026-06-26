"use client";

import type { ReactElement } from "react";
import { EmptyState } from "./empty-state";
import { Money } from "./money";

export interface CashflowChartProps {
  points: Array<{ date: string; incomeCents: number; expenseCents: number; netCents: number }>;
  w?: number;
  h?: number;
}

const VIZ_INCOME = "var(--income)";
const VIZ_EXPENSE = "var(--expense)";
const VIZ_NET = "var(--viz-1)";

/**
 * CashflowChart — historical income/expense bar chart with a net line overlay.
 * Design ref: design_handoff_upshot/Upshot Component Specs.md §Cashflow/Forecast.
 * Actual line = --viz-1 (coral). Projected tail (dashed) + "Today" divider are 6.2.
 * Client component; serializable cents props only.
 */
export function CashflowChart({ points, w = 540, h = 220 }: CashflowChartProps): ReactElement {
  if (points.length === 0) {
    return (
      <EmptyState
        icon="trend"
        title="No cashflow data yet"
        hint="Cashflow history will appear once transactions sync."
      />
    );
  }

  const padX = 12;
  const padY = 12;
  const chartW = w - padX * 2;
  const chartH = h - padY * 2 - 20; // 20 for x-axis labels

  const n = points.length;
  const barSlotW = chartW / n;
  const barW = Math.min(barSlotW * 0.55, 28);

  // Convert cents → dollars for scale
  const maxVal = Math.max(
    ...points.map((p) => Math.max(p.incomeCents, p.expenseCents)),
    1,
  ) / 100;

  const Y = (v: number) => padY + chartH - (v / maxVal) * chartH;
  const X = (i: number) => padX + (i + 0.5) * barSlotW;

  const netLine = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${X(i).toFixed(1)} ${Y(p.netCents / 100).toFixed(1)}`)
    .join(" ");

  const lastPoint = points[points.length - 1]!;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <svg
        width="100%"
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label="Cashflow chart: income, expenses and net over time"
        style={{ display: "block", overflow: "visible" }}
      >
        {/* Baseline */}
        <line
          x1={padX}
          x2={w - padX}
          y1={padY + chartH}
          y2={padY + chartH}
          stroke="var(--line)"
          strokeWidth={1}
        />

        {/* Income + expense bars, net line */}
        {points.map((p, i) => {
          const cx = X(i);
          const incomeH = (p.incomeCents / 100 / maxVal) * chartH;
          const expenseH = (p.expenseCents / 100 / maxVal) * chartH;
          const incomeY = padY + chartH - incomeH;
          const expenseY = padY + chartH - expenseH;
          return (
            <g key={p.date}>
              {/* Income bar (left of centre) */}
              <rect
                x={cx - barW / 2 - barW * 0.05}
                y={incomeY}
                width={barW / 2}
                height={incomeH}
                fill={VIZ_INCOME}
                opacity={0.7}
                rx={2}
              />
              {/* Expense bar (right of centre) */}
              <rect
                x={cx + barW * 0.05}
                y={expenseY}
                width={barW / 2}
                height={expenseH}
                fill={VIZ_EXPENSE}
                opacity={0.7}
                rx={2}
              />
              {/* Month label */}
              <text
                x={cx}
                y={padY + chartH + 14}
                textAnchor="middle"
                fontSize={9}
                fill="var(--text-3)"
              >
                {p.date.length >= 7 ? p.date.slice(5, 7) : p.date}
              </text>
            </g>
          );
        })}

        {/* Net line (--viz-1 coral) */}
        <path
          d={netLine}
          fill="none"
          stroke={VIZ_NET}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* End dot on net line */}
        <circle
          cx={X(n - 1)}
          cy={Y(lastPoint.netCents / 100)}
          r={3}
          fill={VIZ_NET}
          stroke="var(--bg)"
          strokeWidth={2}
        />
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", gap: 20 }}>
        <LegendItem swatch={VIZ_INCOME} label="Income">
          <Money
            cents={lastPoint.incomeCents}
            kind="income"
            size={12}
            weight={600}
            showCents={false}
          />
        </LegendItem>
        <LegendItem swatch={VIZ_EXPENSE} label="Expenses">
          <Money
            cents={lastPoint.expenseCents}
            kind="expense"
            size={12}
            weight={600}
            showCents={false}
          />
        </LegendItem>
        <LegendItem swatch={VIZ_NET} label="Net">
          <Money
            cents={lastPoint.netCents}
            kind="neutral"
            size={12}
            weight={600}
            showCents={false}
          />
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
          style={{
            width: 8,
            height: 8,
            borderRadius: 3,
            background: swatch,
            display: "inline-block",
          }}
        />
        {label}
      </span>
      {children}
    </div>
  );
}
