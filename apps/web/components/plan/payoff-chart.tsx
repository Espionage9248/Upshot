"use client";

interface Curve {
  month: string;
  balanceCents: number;
}

function path(points: Curve[], maxMonths: number, maxBalance: number, w: number, h: number): string {
  if (points.length === 0 || maxBalance === 0) return "";
  return points
    .map((p, i) => {
      const x = (i / Math.max(1, maxMonths - 1)) * w;
      const y = h - (p.balanceCents / maxBalance) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function PayoffChart({
  baseline,
  scenario,
  locked,
}: {
  baseline: Curve[];
  scenario: Curve[];
  locked?: Curve[] | null;
}) {
  const w = 320;
  const h = 120;
  const all = [...baseline, ...scenario, ...(locked ?? [])];
  const maxMonths = Math.max(baseline.length, scenario.length, locked?.length ?? 0);
  const maxBalance = Math.max(1, ...all.map((p) => p.balanceCents));

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label="Projected debt balance over time"
      style={{ display: "block" }}
    >
      <line x1={0} y1={h} x2={w} y2={h} stroke="var(--line)" strokeWidth={1} />
      <path d={path(baseline, maxMonths, maxBalance, w, h)} fill="none" stroke="var(--text-3)" strokeWidth={1.5} />
      {locked && locked.length > 0 && (
        <path d={path(locked, maxMonths, maxBalance, w, h)} fill="none" stroke="var(--text-3)" strokeWidth={1} strokeDasharray="3 3" opacity={0.6} />
      )}
      <path d={path(scenario, maxMonths, maxBalance, w, h)} fill="none" stroke="var(--coral)" strokeWidth={2} />
    </svg>
  );
}
