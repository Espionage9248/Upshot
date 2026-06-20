import type { ReactNode } from "react";
import { Card, CardBody, CardHeader, CardTitle, Badge, Confidence, Money } from "@upshot/ui";
import type { ConfidenceLevel } from "@upshot/ui";
import type { SaverView } from "@/app/(app)/budget/data";
import type { SaverMonthHistory } from "@upshot/core";

/** Maps a goal-confidence band to the Confidence atom's level. */
function bandToLevel(band: "low" | "medium" | "high"): ConfidenceLevel {
  return band === "high" ? "on" : band === "medium" ? "at" : "off";
}

/**
 * Status → label + badge tone.
 * - Goal savers: GOAL_MET / BUILDING (balance vs target).
 * - Envelope savers: BUILDING / STEADY / DRAWING_DOWN (6-month accumulation trend).
 * Only DRAWING_DOWN warns; accruing is the healthy default for a saver.
 */
const STATUS_LABEL: Record<SaverView["analysis"]["status"], { label: string; tone: "saved" | "warn" | "neutral" }> = {
  GOAL_MET: { label: "Goal met", tone: "saved" },
  BUILDING: { label: "Building", tone: "neutral" },
  STEADY: { label: "Steady", tone: "neutral" },
  DRAWING_DOWN: { label: "Drawing down", tone: "warn" },
};

const aud0 = (cents: number) =>
  (cents / 100).toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });

/** Short month label from a `yyyy-MM` string, e.g. "2026-04" → "Apr". */
function shortMonth(ym: string): string {
  const year = Number(ym.slice(0, 4));
  const mon = Number(ym.slice(5, 7));
  return new Date(year, mon - 1, 1).toLocaleDateString("en-AU", { month: "short" });
}

/** One column in the 6-month breakdown grid. */
function MonthCell({ entry }: { entry: SaverMonthHistory }): ReactNode {
  const saved = entry.variance >= 0;
  return (
    <div
      data-testid="saver-month-row"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
      }}
    >
      <span style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.02em" }}>
        {shortMonth(entry.month)}
      </span>
      <span data-testid="saver-month-variance">
        <Money
          cents={Math.abs(entry.variance)}
          kind={saved ? "saved" : "expense"}
          size={11}
          weight={600}
          showCents={false}
        />
      </span>
    </div>
  );
}

/**
 * A saver envelope card. A saver WITH a goal shows balance-vs-target (progress
 * bar + Goal met/Building) and a goal-confidence ring; a saver WITHOUT a goal
 * shows its monthly allocation and a 6-month accumulation trend badge (no
 * progress bar — there is no target to progress toward).
 *
 * Presentational — data arrives via props; no DB/auth/hooks. Token-exact to the
 * VEnvelope + Confidence design refs (5px bar, --coral gradient / --warn, .tnum).
 */
export function SaverCard({ saver }: { saver: SaverView }): ReactNode {
  const a = saver.analysis;
  const status = STATUS_LABEL[a.status];
  const isGoal = a.mode === "goal";
  const balance = a.currentBalance;
  const over = balance < 0;
  // Goal saver: secondary figure is the target + a balance/target bar.
  // Envelope saver: secondary figure is this month's allocation, no bar.
  const secondaryCents = isGoal ? (saver.goal?.targetCents ?? 0) : a.monthlyAllocation;
  const goalPct = Math.max(0, Math.min(1, a.goalProgress ?? 0));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{saver.name}</CardTitle>
        <Badge tone={status.tone}>{status.label}</Badge>
      </CardHeader>
      <CardBody>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {/* balance / (target | allocation) row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: 12,
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <Money cents={balance} kind={over ? "expense" : "saved"} size={18} weight={700} />
            </span>
            <span
              className="tnum"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                color: "var(--text-3)",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              / {aud0(secondaryCents)}
            </span>
          </div>

          {/* 5px balance/target bar — goal savers only (coral gradient, full when met) */}
          {isGoal && (
            <div
              data-testid="saver-bar"
              style={{ height: 5, borderRadius: 999, background: "var(--surface-2)", overflow: "hidden" }}
            >
              <div
                style={{
                  width: `${goalPct * 100}%`,
                  height: "100%",
                  borderRadius: 999,
                  background:
                    "linear-gradient(90deg, color-mix(in oklch, var(--coral) 80%, #fff), var(--coral))",
                }}
              />
            </div>
          )}

          {/* spend / variance trend line */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--text-3)" }}>
            <span>
              Spent <span className="tnum" style={{ fontFamily: "var(--font-mono)" }}>{aud0(a.monthlySpending)}</span>
            </span>
            <span style={{ color: a.variance < 0 ? "var(--warn)" : "var(--text-3)" }}>
              {a.variance >= 0 ? "left " : "over "}
              <span className="tnum" style={{ fontFamily: "var(--font-mono)" }}>{aud0(Math.abs(a.variance))}</span>
            </span>
          </div>

          {/* 6-month per-month breakdown — only when history is present */}
          {a.last6Months.length > 0 && (
            <div
              data-testid="saver-month-history"
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${a.last6Months.length}, 1fr)`,
                gap: 4,
                marginTop: 2,
                paddingTop: 8,
                borderTop: "1px solid var(--surface-2)",
              }}
            >
              {[...a.last6Months].reverse().map((h) => (
                <MonthCell key={h.month} entry={h} />
              ))}
            </div>
          )}

          {/* goal-confidence ring (only when the saver has a target) */}
          {saver.confidence && (
            <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 4 }}>
              {saver.goal && (
                <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>
                  Goal{" "}
                  <span className="tnum" style={{ fontFamily: "var(--font-mono)" }}>{aud0(saver.goal.targetCents)}</span>{" "}
                  by {new Date(saver.goal.targetDate).toLocaleDateString("en-AU", { month: "short", year: "numeric" })}
                </span>
              )}
              <Confidence level={bandToLevel(saver.confidence.band)} />
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
