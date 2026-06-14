import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export interface StatProps {
  label: string;
  value: ReactNode;
  trend?: ReactNode;
  spark?: number[];
  className?: string;
}

function Sparkline({ points }: { points: number[] }) {
  const w = 64;
  const h = 20;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const rng = max - min || 1;
  const X = (i: number) => (i / (points.length - 1)) * w;
  const Y = (v: number) => h - ((v - min) / rng) * (h - 4) - 2;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      style={{ display: "block", overflow: "visible" }}
    >
      <polyline
        points={points.map((p, i) => `${X(i).toFixed(1)},${Y(p).toFixed(1)}`).join(" ")}
        stroke="var(--coral)"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function Stat({ label, value, trend, spark, className }: StatProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {/* eyebrow label — --text-label style from card.tsx */}
      <div
        className="text-[length:var(--text-label)] font-bold uppercase tracking-[0.09em]"
        style={{ color: "var(--text-3)" }}
      >
        {label}
      </div>
      {/* big mono value */}
      <div
        data-value=""
        style={{
          fontFamily: "var(--font-mono)",
          fontWeight: 700,
          fontSize: "var(--text-money-xl)",
          lineHeight: "var(--text-money-xl--line-height)",
          color: "var(--text)",
        }}
      >
        {value}
      </div>
      {/* trend + sparkline row */}
      {(trend !== undefined || spark) && (
        <div className="flex items-center gap-2 mt-0.5">
          {trend !== undefined && (
            <div
              style={{
                fontSize: "var(--text-bodysm)",
                color: "var(--text-3)",
              }}
            >
              {trend}
            </div>
          )}
          {spark && spark.length >= 2 && <Sparkline points={spark} />}
        </div>
      )}
    </div>
  );
}
