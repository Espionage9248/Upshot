import type { ReactNode } from "react";
import { Card, CardBody, CardHeader, CardTitle, Badge, Confidence, Money } from "@upshot/ui";
import type { ConfidenceLevel } from "@upshot/ui";
import type { SaverView } from "@/app/(app)/budget/data";

/** Maps a goal-confidence band to the Confidence atom's level. */
function bandToLevel(band: "low" | "medium" | "high"): ConfidenceLevel {
  return band === "high" ? "on" : band === "medium" ? "at" : "off";
}

/** Trend → a short human label + badge tone (token-exact semantics). */
const TREND_LABEL: Record<SaverView["analysis"]["trend"], { label: string; tone: "saved" | "warn" | "neutral" }> = {
  OVERFUNDED: { label: "Overfunded", tone: "saved" },
  OPTIMAL: { label: "On track", tone: "neutral" },
  UNDERFUNDED: { label: "Underfunded", tone: "warn" },
};

/**
 * A saver envelope card: balance vs allocation, role badge, trend badge, the
 * balance/allocation progress bar (coral gradient when funded, warn when
 * over-allocated), and a Confidence ring when the saver has a goal target.
 *
 * Presentational — data arrives via props; no DB/auth/hooks. Token-exact to the
 * VEnvelope + Confidence design refs (5px bar, --coral gradient / --warn, .tnum).
 */
export function SaverCard({ saver }: { saver: SaverView }): ReactNode {
  const a = saver.analysis;
  const allocation = a.monthlyAllocation;
  const balance = a.currentBalance;
  const over = balance < 0;
  const pct = allocation > 0 ? Math.max(0, Math.min(1, balance / allocation)) : 0;
  const trend = TREND_LABEL[a.trend];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{saver.name}</CardTitle>
        <Badge tone={trend.tone}>{trend.label}</Badge>
      </CardHeader>
      <CardBody>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {/* balance / allocation row */}
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
              / {(allocation / 100).toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 })}
            </span>
          </div>

          {/* 5px balance/allocation bar — coral gradient when funded, warn when over */}
          <div
            data-testid="saver-bar"
            style={{ height: 5, borderRadius: 999, background: "var(--surface-2)", overflow: "hidden" }}
          >
            <div
              style={{
                width: `${(over ? 1 : pct) * 100}%`,
                height: "100%",
                borderRadius: 999,
                background: over
                  ? "var(--warn)"
                  : "linear-gradient(90deg, color-mix(in oklch, var(--coral) 80%, #fff), var(--coral))",
              }}
            />
          </div>

          {/* spend / variance trend line */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--text-3)" }}>
            <span>
              Spent <span className="tnum" style={{ fontFamily: "var(--font-mono)" }}>
                {(a.monthlySpending / 100).toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 })}
              </span>
            </span>
            <span style={{ color: a.variance < 0 ? "var(--warn)" : "var(--text-3)" }}>
              {a.variance >= 0 ? "left " : "over "}
              <span className="tnum" style={{ fontFamily: "var(--font-mono)" }}>
                {(Math.abs(a.variance) / 100).toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 })}
              </span>
            </span>
          </div>

          {/* goal-confidence ring (only when the saver has a target) */}
          {saver.confidence && (
            <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 4 }}>
              {saver.goal && (
                <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>
                  Goal{" "}
                  <span className="tnum" style={{ fontFamily: "var(--font-mono)" }}>
                    {(saver.goal.targetCents / 100).toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 })}
                  </span>{" "}
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
