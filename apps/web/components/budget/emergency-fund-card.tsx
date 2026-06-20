import type { ReactNode } from "react";
import { Card, CardBody, CardHeader, CardTitle, Badge, Money, ReadinessGauge } from "@upshot/ui";
import type { EmergencyFundAnalysis } from "@upshot/core";

/**
 * Emergency-fund status → badge, sharing the goal vocabulary with SaverCard:
 * GOAL_MET → "Goal met", BUILDING → "Building", DEPLETED → "Drawing down"
 * (a 3-month net withdrawal not yet replaced — the EF flavour of depletion).
 */
const EF_STATUS: Record<EmergencyFundAnalysis["status"], { label: string; tone: "saved" | "warn" | "neutral" }> = {
  GOAL_MET: { label: "Goal met", tone: "saved" },
  BUILDING: { label: "Building", tone: "neutral" },
  DEPLETED: { label: "Drawing down", tone: "warn" },
};

/**
 * Emergency-fund readiness card: a status badge (shared goal vocabulary), the
 * readiness gauge (progress % of the 6-month target), balance / target, and the
 * top-up still needed to reach the goal.
 *
 * Presentational — data arrives via props; no DB/auth/hooks. Token-exact to the
 * BeaconDashboard readiness ref (gauge + balance/target line + tips).
 */
export function EmergencyFundCard({ fund }: { fund: EmergencyFundAnalysis }): ReactNode {
  const status = EF_STATUS[fund.status];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Emergency-fund readiness</CardTitle>
        <Badge tone={status.tone}>{status.label}</Badge>
      </CardHeader>
      <CardBody>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <ReadinessGauge percent={fund.progressPercent} sub="of goal" size={130} />

          {/* balance / target */}
          <div style={{ textAlign: "center" }}>
            <Money cents={fund.currentBalance} kind="saved" size={15} weight={700} />
            <span style={{ fontSize: 13, color: "var(--text-3)" }}>
              {" "}/ {(fund.targetBalance / 100).toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 })}
              {" · "}{fund.targetMonths} mo goal
            </span>
          </div>

          {/* top-up needed to reach goal */}
          {fund.topUpNeeded > 0 ? (
            <div style={{ fontSize: 11.5, color: "var(--text-3)", textAlign: "center" }}>
              Still needed{" "}
              <span style={{ color: "var(--text-2)", fontWeight: 600 }}>
                <Money cents={fund.topUpNeeded} kind="neutral" size={11.5} weight={600} showCents={false} quiet />
              </span>{" "}
              to reach the goal.
            </div>
          ) : (
            <div style={{ fontSize: 11.5, color: "var(--saved)", fontWeight: 600, textAlign: "center" }}>
              Fully funded.
            </div>
          )}

          {fund.readinessTips.length > 0 && (
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
              {fund.readinessTips.map((tip) => (
                <li key={tip} style={{ fontSize: 11.5, color: "var(--text-3)", textAlign: "center" }}>
                  {tip}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
