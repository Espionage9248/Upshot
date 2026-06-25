"use client";

import type { ReactElement } from "react";
import { Skeleton, UIcon } from "@upshot/ui";
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
  raise?: { fromMonth: string } | null;
  height?: number;
  loading?: boolean;
  lockedCurve?: Point[] | null;
  youAreHere?: { month: string; balanceCents: number } | null;
  compact?: boolean;
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
  raise = null,
  height = 320,
  loading = false,
  lockedCurve = null,
  youAreHere = null,
  compact = false,
}: PayoffChartProps): ReactElement {
  // --- Loading state ---
  if (loading) {
    return (
      <div
        style={{
          height,
          borderRadius: "var(--radius-card)",
          border: "1px solid var(--line)",
          background: "var(--surface)",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          gap: 0,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Skeleton
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 0,
            background: undefined,
          }}
          aria-hidden="true"
        />
        <svg
          width="100%"
          height={height - 40}
          viewBox="0 0 1000 300"
          preserveAspectRatio="none"
          style={{ opacity: 0.5, position: "relative" }}
          aria-hidden="true"
        >
          <path d="M0 60 C200 80 380 150 520 200 S820 280 1000 290" fill="none" stroke="var(--surface-3)" strokeWidth="3" strokeLinecap="round" />
          <path d="M0 90 C220 150 420 230 560 260 S860 295 1000 298" fill="none" stroke="var(--surface-3)" strokeWidth="3" strokeDasharray="4 5" strokeLinecap="round" opacity={0.7} />
        </svg>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-3)", fontSize: 12, fontWeight: 600, position: "relative" }}>
          <span
            className="animate-spin motion-reduce:animate-none"
            style={{
              width: 13,
              height: 13,
              borderRadius: 999,
              border: "2px solid var(--text-3)",
              borderTopColor: "transparent",
              display: "inline-block",
            }}
            aria-hidden="true"
          />
          {" "}Recomputing against your current debts…
        </div>
      </div>
    );
  }

  // --- Empty state ---
  if (scenario.length === 0 && baseline.length === 0) {
    return (
      <div
        style={{
          height,
          borderRadius: "var(--radius-card)",
          border: "1px dashed var(--line)",
          background:
            "repeating-linear-gradient(135deg, transparent, transparent 9px, color-mix(in oklch, var(--text-3) 4%, transparent) 9px, color-mix(in oklch, var(--text-3) 4%, transparent) 10px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: 24,
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 13,
            background: "var(--surface-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-3)",
          }}
        >
          <UIcon name="trend" size={24} />
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-2)" }}>
          Your payoff curve will appear here
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-3)", maxWidth: 300, lineHeight: 1.45 }}>
          Add an extra amount toward your debts and we'll plot when you'd be debt-free against doing nothing.
        </div>
      </div>
    );
  }

  const W = 1000;
  const H = height;
  const padL = 52;
  const padR = 20;
  const padT = 16;
  const padB = 30;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  // horizon (months) = longest curve length, clamped.
  const scenLast = scenario[scenario.length - 1];
  const baseLast = baseline[baseline.length - 1];
  const lockedLast = lockedCurve && lockedCurve.length > 0 ? lockedCurve[lockedCurve.length - 1] : null;
  const scenLen = scenLast ? diffMonths(startMonth, scenLast.month) : 0;
  const baseLen = baseLast ? diffMonths(startMonth, baseLast.month) : 0;
  const lockedLen = lockedLast ? diffMonths(startMonth, lockedLast.month) : 0;
  const horizon = Math.min(Math.max(scenLen, baseLen, lockedLen, 1) + 2, 64);

  const allMax = Math.max(
    1,
    ...scenario.map((p) => p.balanceCents),
    ...baseline.map((p) => p.balanceCents),
    ...(lockedCurve ? lockedCurve.map((p) => p.balanceCents) : []),
  );
  const yMax = niceMaxCents(allMax);

  const X = (m: number): number => padL + (m / horizon) * plotW;
  const Y = (cents: number): number => padT + (1 - cents / yMax) * plotH;

  const toPath = (pts: Point[]): string =>
    pts
      .map((p, i) => `${i ? "L" : "M"}${X(diffMonths(startMonth, p.month)).toFixed(1)} ${Y(p.balanceCents).toFixed(1)}`)
      .join(" ");

  const yTicks = [0, yMax / 4, yMax / 2, (yMax * 3) / 4, yMax];
  const xTicks: number[] = [];
  for (let m = 0; m <= horizon; m += compact ? 12 : 6) xTicks.push(m);

  const scenMonths = scenarioDebtFreeMonth ? diffMonths(startMonth, scenarioDebtFreeMonth) : null;
  const baseMonths = baselineDebtFreeMonth ? diffMonths(startMonth, baselineDebtFreeMonth) : null;

  // scenario area fill closes the path to the x-axis.
  const scenArea = scenLast
    ? `${toPath(scenario)} L${X(diffMonths(startMonth, scenLast.month)).toFixed(1)} ${Y(0).toFixed(1)} L${X(0).toFixed(1)} ${Y(0).toFixed(1)} Z`
    : "";

  const lumpScenPoint = lump && scenario.length
    ? scenario.reduce((best, p) =>
        Math.abs(diffMonths(startMonth, p.month) - lump.monthIndex) <
        Math.abs(diffMonths(startMonth, best.month) - lump.monthIndex)
          ? p
          : best
      )
    : null;
  const lumpY = lumpScenPoint ? Y(lumpScenPoint.balanceCents) : 0;

  const chartSvg = (
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
      {/* locked reference curve (behind scenario) */}
      {lockedCurve && lockedCurve.length > 0 && (
        <path
          d={toPath(lockedCurve)}
          fill="none"
          stroke="var(--text-3)"
          strokeWidth={1.5}
          strokeDasharray="1 4"
          strokeLinecap="round"
          opacity={0.6}
        />
      )}
      {/* you-are-here marker on locked curve */}
      {youAreHere && lockedCurve && lockedCurve.length > 0 && (() => {
        const cx = X(diffMonths(startMonth, youAreHere.month));
        const cy = Y(youAreHere.balanceCents);
        return (
          <g>
            <circle cx={cx} cy={cy} r={5} fill="var(--coral)" />
            <text
              x={cx + 8}
              y={cy - 6}
              fontSize={10}
              fontWeight={600}
              fill="var(--coral)"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              you are here
            </text>
          </g>
        );
      })()}
      {/* baseline dashed */}
      {baseline.length > 0 && <path d={toPath(baseline)} fill="none" stroke="var(--proj)" strokeWidth={2} strokeDasharray="3 4" strokeLinecap="round" />}
      {/* scenario solid */}
      {scenario.length > 0 && <path d={toPath(scenario)} fill="none" stroke="var(--coral)" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />}
      {/* lump notch */}
      {lump && lumpScenPoint && (
        <g>
          <line x1={X(lump.monthIndex)} x2={X(lump.monthIndex)} y1={lumpY - 4} y2={lumpY + 18} stroke="var(--coral)" strokeWidth={1.5} />
          <circle cx={X(lump.monthIndex)} cy={lumpY} r={3.5} fill="var(--coral)" stroke="var(--surface)" strokeWidth={1.5} />
          <text x={X(lump.monthIndex)} y={lumpY + 31} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="var(--coral-text)" style={{ fontFamily: "var(--font-sans)" }}>
            + lump
          </text>
        </g>
      )}
      {/* pay-rise notch */}
      {raise && scenario.length > 0 && (() => {
        const ri = diffMonths(startMonth, raise.fromMonth);
        if (ri <= 0 || ri > horizon) return null;
        const rp = scenario.reduce((best, p) =>
          Math.abs(diffMonths(startMonth, p.month) - ri) < Math.abs(diffMonths(startMonth, best.month) - ri) ? p : best,
        );
        const ry = Y(rp.balanceCents);
        return (
          <g>
            <line x1={X(ri)} x2={X(ri)} y1={ry - 4} y2={ry + 18} stroke="var(--coral)" strokeWidth={1.5} />
            <circle cx={X(ri)} cy={ry} r={3.5} fill="var(--coral)" stroke="var(--surface)" strokeWidth={1.5} />
            <text x={X(ri)} y={ry + 31} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="var(--coral-text)" style={{ fontFamily: "var(--font-sans)" }}>
              ↑ pay rise
            </text>
          </g>
        );
      })()}
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

  if (!compact) return chartSvg;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {chartSvg}
      <div style={{ display: "flex", gap: 16, fontSize: 11.5, color: "var(--text-3)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 14, height: 0, borderTop: "2.8px solid var(--coral)" }} aria-hidden="true" /> Your plan
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 14, height: 0, borderTop: "2px dashed var(--proj)" }} aria-hidden="true" /> Doing nothing
        </span>
      </div>
    </div>
  );
}
