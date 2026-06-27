"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  ReadinessGauge,
  SpendingHeatmap,
  StreakIndicator,
  InsightCard,
  EmptyState,
  Money,
} from "@upshot/ui";
import type { AnalyticsData } from "@/app/(app)/analyse/analytics/data";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const GRADE_COLOUR: Record<string, string> = {
  excellent: "var(--income)",
  good: "var(--income)",
  fair: "var(--warning)",
  poor: "var(--expense)",
};

function gradeLabel(grade: AnalyticsData["health"]["grade"]): string {
  const map: Record<typeof grade, string> = {
    excellent: "Excellent",
    good: "Good",
    fair: "Fair",
    poor: "Poor",
  };
  return map[grade];
}

/** Display a saver's alignment bar: allocated vs spent variance. */
function AlignmentBar({
  allocatedCents,
  spentCents,
  varianceCents,
  variancePercentage,
}: {
  allocatedCents: number;
  spentCents: number;
  varianceCents: number;
  variancePercentage: number;
}) {
  const pct = Math.max(0, Math.min(100, 100 - Math.abs(variancePercentage)));
  const colour = varianceCents >= 0 ? "var(--income)" : "var(--expense)";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div
        style={{
          height: 6,
          borderRadius: 3,
          background: "var(--surface-3)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: colour,
            borderRadius: 3,
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          color: "var(--text-3)",
        }}
      >
        <span>
          Spent <Money cents={spentCents} kind="expense" />
        </span>
        <span>
          Budget <Money cents={allocatedCents} kind="expense" />
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export function AnalyticsView({ data }: { data: AnalyticsData }) {
  const { health, envelopeAlignment, emergencyFund, behaviouralInsights, spendingInsights, heatmap, streak, tagSummary } = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Budget health score ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Budget health</CardTitle>
        </CardHeader>
        <CardBody>
          <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            {/* Score circle */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: "var(--surface-2)",
                  border: `3px solid ${GRADE_COLOUR[health.grade] ?? "var(--text-3)"}`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    color: GRADE_COLOUR[health.grade] ?? "var(--text)",
                  }}
                >
                  {health.score}
                </span>
                <span style={{ fontSize: 10, color: "var(--text-3)" }}>/100</span>
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: GRADE_COLOUR[health.grade] ?? "var(--text-2)",
                }}
              >
                {gradeLabel(health.grade)}
              </span>
            </div>

            {/* Factor breakdown */}
            <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 8 }}>
              {health.factors.map((f) => (
                <div key={f.label}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      marginBottom: 2,
                    }}
                  >
                    <span style={{ color: "var(--text-2)", fontWeight: 500 }}>{f.label}</span>
                    <span style={{ color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                      {f.points}/{f.max}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 4,
                      borderRadius: 2,
                      background: "var(--surface-3)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.round((f.points / f.max) * 100)}%`,
                        background: "var(--coral)",
                        borderRadius: 2,
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2 }}>
                    {f.detail}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* ── Two-column row: Envelope alignment + EF readiness ───────────── */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>

        {/* Envelope / saver alignment */}
        <Card style={{ flex: "1 1 280px", minWidth: 0 }}>
          <CardHeader>
            <CardTitle>Envelope alignment</CardTitle>
          </CardHeader>
          <CardBody>
            {envelopeAlignment.length === 0 ? (
              <EmptyState
                icon="wallet"
                title="No saver envelopes"
                hint="Add a Saver account to track envelope alignment."
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {envelopeAlignment.map((s) => (
                  <div key={s.saverId}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--text-1)",
                        marginBottom: 6,
                      }}
                    >
                      {s.saverName}
                    </div>
                    <AlignmentBar
                      allocatedCents={s.monthlyAllocation}
                      spentCents={s.monthlySpending}
                      varianceCents={s.variance}
                      variancePercentage={s.variancePercentage}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Emergency fund readiness */}
        <Card style={{ flex: "1 1 200px", minWidth: 0 }}>
          <CardHeader>
            <CardTitle>Emergency fund readiness</CardTitle>
          </CardHeader>
          <CardBody>
            {emergencyFund === null ? (
              <EmptyState
                icon="shield"
                title="No emergency fund"
                hint="Add an Emergency account to track your readiness."
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
                <ReadinessGauge
                  percent={emergencyFund.readinessScore}
                  sub={emergencyFund.readinessTier}
                  size={100}
                />
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-3)",
                    textAlign: "center",
                  }}
                >
                  <Money cents={emergencyFund.currentBalance} /> of{" "}
                  <Money cents={emergencyFund.targetBalance} /> target
                </div>
                {emergencyFund.readinessTips.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
                    {emergencyFund.readinessTips.map((tip, i) => (
                      <InsightCard key={i} icon="sparkle">
                        {tip}
                      </InsightCard>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* ── Spending heatmap + No-spend streak ──────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Spending heatmap — last 90 days</CardTitle>
        </CardHeader>
        <CardBody>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <SpendingHeatmap days={heatmap} />
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>No-spend streak</span>
              <StreakIndicator currentDays={streak.currentDays} bestDays={streak.bestDays} />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* ── Behavioural patterns ────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Behavioural patterns</CardTitle>
        </CardHeader>
        <CardBody>
          {behaviouralInsights.length === 0 ? (
            <EmptyState
              icon="clock"
              title="Not enough data yet"
              hint="Behavioural patterns appear after 30+ days of transaction history."
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {behaviouralInsights.map((insight, i) => (
                <InsightCard key={i} icon="trend">
                  {insight.message}
                </InsightCard>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* ── Category spending insights ──────────────────────────────────── */}
      {spendingInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Categorised spending insights</CardTitle>
          </CardHeader>
          <CardBody>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {spendingInsights.map((insight, i) => (
                <InsightCard
                  key={i}
                  icon={insight.severity === "warning" ? "alert" : "sparkle"}
                >
                  {insight.message}
                </InsightCard>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* ── Tag summary ─────────────────────────────────────────────────── */}
      {tagSummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Spending by tag</CardTitle>
          </CardHeader>
          <CardBody>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {tagSummary.map((item) => (
                <div
                  key={item.tag}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 13,
                    padding: "6px 0",
                    borderBottom: "1px solid var(--line-soft)",
                  }}
                >
                  <span style={{ color: "var(--text-2)", fontWeight: 500 }}>{item.tag}</span>
                  <span style={{ color: "var(--text-3)", fontSize: 12 }}>
                    {item.transactionCount} txn{item.transactionCount !== 1 ? "s" : ""}
                  </span>
                  <Money cents={item.totalCents} kind="expense" />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
