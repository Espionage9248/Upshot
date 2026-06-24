"use client";

import type { ReactElement } from "react";
import { labelMonth, diffMonths, addMonths } from "./planner-atoms";

const MONO = "var(--font-mono)";

interface Point {
  month: string;
  balanceCents: number;
}

interface PayoffChartProps {
  startMonth: string;
  scenario: Point[];
  baseline: Point[];
  scenarioDebtFreeMonth: string | null;
  baselineDebtFreeMonth: string | null;
  lump?: { monthIndex: number; amountCents: number } | null;
  height?: number;
}

/** smallest nice ceiling ≥ v (cents). */
function niceMaxCents(v: number): number {
  const steps = [200000, 400000, 500000, 1000000, 1500000, 2000000, 5000000];
  for (const s of steps) if (v <= s) return s;
  return Math.ceil(v / 1000000) * 1000000;
}

export function PayoffChart({
  startMonth,
  scenario,
  baseline,
  scenarioDebtFreeMonth,
  baselineDebtFreeMonth,
  lump = null,
  height = 320,
}: PayoffChartProps): ReactElement {
  const W = 1000;
  const H = height;
  const padL = 52;
  const padR = 20;
  const padT = 16;
  const padB = 30;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  // horizon (months) = longest curve length, clamped.
  const scenLen = scenario.length ? diffMonths(startMonth, scenario[scenario.length - 1].month) : 0;
  const baseLen = baseline.length ? diffMonths(startMonth, baseline[baseline.length - 1].month) : 0;
  const horizon = Math.min(Math.max(scenLen, baseLen, 1) + 2, 64);

  const allMax = Math.max(1, ...scenario.map((p) => p.balanceCents), ...baseline.map((p) => p.balanceCents));
  const yMax = niceMaxCents(allMax);

  const X = (m: number): number => padL + (m / horizon) * plotW;
  const Y = (cents: number): number => padT + (1 - cents / yMax) * plotH;

  const toPath = (pts: Point[]): string =>
    pts
      .map((p, i) => `${i ? "L" : "M"}${X(diffMonths(startMonth, p.month)).toFixed(1)} ${Y(p.balanceCents).toFixed(1)}`)
      .join(" ");

  const yTicks = [0, yMax / 3, (yMax * 2) / 3, yMax];
  const xTicks: number[] = [];
  for (let m = 0; m <= horizon; m += 6) xTicks.push(m);

  const scenMonths = scenarioDebtFreeMonth ? diffMonths(startMonth, scenarioDebtFreeMonth) : null;
  const baseMonths = baselineDebtFreeMonth ? diffMonths(startMonth, baselineDebtFreeMonth) : null;

  // scenario area fill closes the path to the x-axis.
  const scenArea = scenario.length
    ? `${toPath(scenario)} L${X(diffMonths(startMonth, scenario[scenario.length - 1].month)).toFixed(1)} ${Y(0).toFixed(1)} L${X(0).toFixed(1)} ${Y(0).toFixed(1)} Z`
    : "";

  const lumpY =
    lump && scenario.length ? Y(scenario.find((_, i) => i === Math.min(lump.monthIndex, scenario.length - 1))?.balanceCents ?? 0) : 0;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Projected debt balance over time"
      style={{ display: "block", overflow: "visible", fontFamily: MONO }}
      preserveAspectRatio="none"
    >
      {/* y gridlines + labels */}
      {yTicks.map((v, i) => (
        <g key={`y${i}`}>
          <line x1={padL} x2={W - padR} y1={Y(v)} y2={Y(v)} stroke="var(--line-soft)" strokeWidth={1} />
          <text x={padL - 8} y={Y(v) + 3.5} textAnchor="end" fontSize={11} fill="var(--text-3)" style={{ fontFamily: MONO }}>
            {v === 0 ? "$0" : "$" + Math.round(v / 100000) + "k"}
          </text>
        </g>
      ))}
      {/* x ticks + month labels */}
      {xTicks.map((m, i) => (
        <g key={`x${i}`}>
          <line x1={X(m)} x2={X(m)} y1={padT} y2={padT + plotH} stroke="var(--line-soft)" strokeWidth={1} opacity={m === 0 ? 0 : 0.5} />
          <text x={X(m)} y={H - padB + 16} textAnchor="middle" fontSize={10.5} fill="var(--text-3)" style={{ fontFamily: MONO }}>
            {labelMonth(addMonths(startMonth, m))}
          </text>
        </g>
      ))}
      {/* TODAY divider */}
      <line x1={X(0)} x2={X(0)} y1={padT - 2} y2={padT + plotH} stroke="var(--text-3)" strokeWidth={1.2} strokeDasharray="2 3" opacity={0.7} />
      <text x={X(0) + 4} y={padT + 10} fontSize={10} fontWeight={700} fill="var(--text-3)" style={{ fontFamily: "var(--font-sans)" }}>
        TODAY
      </text>
      {/* scenario area fill */}
      {scenArea && <path d={scenArea} fill="var(--coral)" opacity={0.1} stroke="none" />}
      {/* baseline dashed */}
      {baseline.length > 0 && <path d={toPath(baseline)} fill="none" stroke="var(--proj)" strokeWidth={2} strokeDasharray="3 4" strokeLinecap="round" />}
      {/* scenario solid */}
      {scenario.length > 0 && <path d={toPath(scenario)} fill="none" stroke="var(--coral)" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />}
      {/* lump notch */}
      {lump && (
        <g>
          <line x1={X(lump.monthIndex)} x2={X(lump.monthIndex)} y1={lumpY - 4} y2={lumpY + 18} stroke="var(--coral)" strokeWidth={1.5} />
          <circle cx={X(lump.monthIndex)} cy={lumpY} r={3.5} fill="var(--coral)" stroke="var(--surface)" strokeWidth={1.5} />
          <text x={X(lump.monthIndex)} y={lumpY + 31} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="var(--coral-text)" style={{ fontFamily: "var(--font-sans)" }}>
            + lump
          </text>
        </g>
      )}
      {/* baseline debt-free marker (open) */}
      {baseMonths != null && baseMonths <= horizon && (
        <g>
          <circle cx={X(baseMonths)} cy={Y(0)} r={4.5} fill="var(--bg)" stroke="var(--proj)" strokeWidth={2} />
          <text x={X(baseMonths)} y={Y(0) - 10} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="var(--text-3)" style={{ fontFamily: "var(--font-sans)" }}>
            {labelMonth(baselineDebtFreeMonth!)}
          </text>
        </g>
      )}
      {/* scenario debt-free marker (filled + flag) */}
      {scenMonths != null && scenMonths <= horizon && (
        <g>
          <circle cx={X(scenMonths)} cy={Y(0)} r={5.5} fill="var(--coral)" stroke="var(--bg)" strokeWidth={2.5} />
          <line x1={X(scenMonths)} x2={X(scenMonths)} y1={Y(0) - 6} y2={Y(0) - 30} stroke="var(--coral)" strokeWidth={1.5} />
          <g transform={`translate(${X(scenMonths) + 1}, ${Y(0) - 44})`}>
            <rect x={-2} y={0} width={44} height={15} rx={3} fill="var(--coral)" />
            <text x={20} y={11} textAnchor="middle" fontSize={9.5} fontWeight={800} fill="var(--on-coral)" style={{ fontFamily: "var(--font-sans)" }}>
              DEBT-FREE
            </text>
          </g>
          <text x={X(scenMonths)} y={Y(0) + 17} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="var(--coral-text)" style={{ fontFamily: "var(--font-sans)" }}>
            {labelMonth(scenarioDebtFreeMonth!)}
          </text>
        </g>
      )}
    </svg>
  );
}
