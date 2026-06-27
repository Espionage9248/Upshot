import type { ReactElement } from "react";
import Link from "next/link";
import type { CashflowForecast } from "@upshot/core";
import type { ForecastPageData } from "@/app/(app)/analyse/forecast/data";
import { ForecastPanel } from "./forecast-panel";
import { SalaryChangePanel } from "./salary-change-panel";
import { ExpenseChangePanel } from "./expense-change-panel";

type ForecastTab = "forecast" | "salary" | "expense";

interface ForecastViewProps {
  forecast: CashflowForecast;
  salaryBaseline: ForecastPageData["salaryBaseline"];
  expenseBaseline: ForecastPageData["expenseBaseline"];
  horizon: 30 | 60 | 90;
  tab: ForecastTab;
}

const TABS: { key: ForecastTab; label: string }[] = [
  { key: "forecast", label: "Forecast" },
  { key: "salary", label: "Salary change" },
  { key: "expense", label: "Expense change" },
];

/**
 * ForecastView — the /analyse/forecast container. Three server-nav link tabs
 * (?tab=forecast|salary|expense, preserving ?h=) switch between the cash-flow
 * forecast and the two what-if simulators. The horizon stays bound to the
 * Forecast tab via ForecastPanel's own ?h= links.
 */
export function ForecastView({
  forecast,
  salaryBaseline,
  expenseBaseline,
  horizon,
  tab,
}: ForecastViewProps): ReactElement {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Tab strip */}
      <div
        role="tablist"
        aria-label="Forecast view"
        style={{ display: "flex", gap: 4 }}
      >
        {TABS.map((t) => {
          const isActive = t.key === tab;
          return (
            <Link
              key={t.key}
              href={`/analyse/forecast?h=${horizon}&tab=${t.key}`}
              role="tab"
              aria-selected={isActive}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                background: isActive ? "var(--coral-dim)" : "var(--surface-2)",
                color: isActive ? "var(--coral-text)" : "var(--text-2)",
                textDecoration: "none",
              }}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {tab === "forecast" && (
        <ForecastPanel forecast={forecast} horizon={horizon} tab={tab} />
      )}
      {tab === "salary" && (
        <SalaryChangePanel
          currentMonthlyIncomeCents={salaryBaseline.currentMonthlyIncomeCents}
        />
      )}
      {tab === "expense" && (
        <ExpenseChangePanel savers={expenseBaseline.savers} />
      )}
    </div>
  );
}
