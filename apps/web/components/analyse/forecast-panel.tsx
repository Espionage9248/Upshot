"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { ForecastChart, Card, CardHeader, CardTitle, CardBody } from "@upshot/ui";
import type { CashflowForecast } from "@upshot/core";

interface ForecastPanelProps {
  forecast: CashflowForecast;
  horizon: 30 | 60 | 90;
}

const HORIZONS = [30, 60, 90] as const;

/**
 * ForecastPanel — the forecast chart card + 30/60/90-day horizon tab links.
 * Links set ?h= while preserving ?tab=forecast.
 * Simulator panels land in Task 6's ForecastView.
 */
export function ForecastPanel({ forecast, horizon }: ForecastPanelProps): ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash-flow forecast — {horizon}-day outlook</CardTitle>
        {/* Horizon tabs */}
        <div
          role="tablist"
          aria-label="Forecast horizon"
          style={{ display: "flex", gap: 4, marginLeft: "auto" }}
        >
          {HORIZONS.map((h) => {
            const isActive = h === horizon;
            return (
              <Link
                key={h}
                href={`/analyse/forecast?h=${h}&tab=forecast`}
                role="tab"
                aria-selected={isActive}
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 400,
                  background: isActive ? "var(--coral-dim)" : "var(--surface-2)",
                  color: isActive ? "var(--coral-text)" : "var(--text-2)",
                  textDecoration: "none",
                }}
              >
                {h}d
              </Link>
            );
          })}
        </div>
      </CardHeader>
      <CardBody>
        <ForecastChart
          actual={forecast.actual}
          projected={forecast.projected}
          overdraftRisk={forecast.overdraftRisk}
          lowestProjectedCents={forecast.lowestProjectedCents}
          lowestDateISO={forecast.lowestDateISO}
        />
      </CardBody>
    </Card>
  );
}
