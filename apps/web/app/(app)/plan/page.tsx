import type { ReactNode } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardBody, Money, Badge } from "@upshot/ui";
import { TopBar } from "@/components/top-bar";
import { getDb } from "@/lib/db";
import { loadPlanHubData } from "./data";

// Reads session at request time via the (app) layout; pin here too so the
// route is never statically prerendered (mirrors budget/page.tsx).
export const dynamic = "force-dynamic";

function formatMonth(month: string): string {
  const [y, m] = month.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("en-AU", { month: "short", year: "numeric" });
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return date.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

export default async function PlanPage(): Promise<ReactNode> {
  const { db } = getDb();
  const data = await loadPlanHubData(db);

  return (
    <>
      <TopBar title="Plan" sub="WHAT YOU OWE & INTEND" />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 12,
          marginTop: 8,
        }}
      >
        {/* Debts summary card */}
        <Link href="/plan/debts" style={{ textDecoration: "none" }}>
          <Card>
            <CardHeader>
              <CardTitle>Debts</CardTitle>
              {data.debtFreeMonth && (
                <Badge tone="saved">Free {formatMonth(data.debtFreeMonth)}</Badge>
              )}
            </CardHeader>
            <CardBody>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <Money cents={data.debtTotalCents} kind="debt" size={22} weight={700} />
                {data.debtFreeMonth ? (
                  <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                    Debt-free by{" "}
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-2)" }}>
                      {formatMonth(data.debtFreeMonth)}
                    </span>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "var(--text-3)" }}>No payoff schedule</div>
                )}
              </div>
            </CardBody>
          </Card>
        </Link>

        {/* BNPL summary card */}
        <Link href="/plan/installments" style={{ textDecoration: "none" }}>
          <Card>
            <CardHeader>
              <CardTitle>BNPL</CardTitle>
              {data.nextBnpl && (
                <Badge tone="neutral">Due {formatDate(data.nextBnpl.nextDueDate)}</Badge>
              )}
            </CardHeader>
            <CardBody>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {data.nextBnpl ? (
                  <>
                    <Money
                      cents={data.nextBnpl.installmentCents}
                      kind="expense"
                      size={22}
                      weight={700}
                    />
                    <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                      Next:{" "}
                      <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-2)" }}>
                        {data.nextBnpl.merchant}
                      </span>{" "}
                      on {formatDate(data.nextBnpl.nextDueDate)}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 14, color: "var(--text-3)" }}>No active plans</div>
                )}
              </div>
            </CardBody>
          </Card>
        </Link>

        {/* Recurring summary card */}
        <Link href="/plan/recurring" style={{ textDecoration: "none" }}>
          <Card>
            <CardHeader>
              <CardTitle>Recurring</CardTitle>
              {data.upcomingRecurring.length > 0 && (
                <Badge tone="neutral">{data.upcomingRecurring.length} due soon</Badge>
              )}
            </CardHeader>
            <CardBody>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <Money
                  cents={data.recurringMonthlyTotalCents}
                  kind="expense"
                  size={22}
                  weight={700}
                />
                <div style={{ fontSize: 12, color: "var(--text-3)" }}>per month</div>
                {data.upcomingRecurring.length > 0 && (
                  <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>
                    Next:{" "}
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-2)" }}>
                      {data.upcomingRecurring[0]!.name}
                    </span>{" "}
                    on {formatDate(data.upcomingRecurring[0]!.nextExpectedDate)}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </Link>
      </div>
    </>
  );
}
