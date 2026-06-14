import { cn } from "../lib/cn";

export interface ReadinessGaugeProps {
  percent: number;
  sub?: string;
  size?: number;
  className?: string;
}

export function ReadinessGauge({
  percent,
  sub,
  size = 96,
  className,
}: ReadinessGaugeProps) {
  const thickness = 8;
  const pct = Math.min(1, Math.max(0, percent / 100));
  // Ring math ported from ds.jsx Gauge component
  const r = (size - thickness - 2) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - pct);

  return (
    <div
      className={cn("relative flex-shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
      >
        {/* track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth={thickness}
        />
        {/* progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--saved)"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
        />
      </svg>
      {/* centre label */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
      >
        <div
          className="tnum"
          style={{
            fontSize: size * 0.21,
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
          }}
        >
          {Math.round(pct * 100)}%
        </div>
        {sub && (
          <div style={{ fontSize: 9, color: "var(--text-3)" }}>{sub}</div>
        )}
      </div>
    </div>
  );
}
