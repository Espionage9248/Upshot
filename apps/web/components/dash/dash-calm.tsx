import type { ReactNode } from "react";
import Link from "next/link";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  Money,
  SyncStatus,
  UpcomingBills,
  type BillItem,
} from "@upshot/ui";
import { syncHealthToState } from "@/lib/sync-health";
import type { TodayData, UpcomingBill } from "@/app/(app)/today/data";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Maps a domain `UpcomingBill` to the UI `BillItem`. `daysUntil` is whole days
 * from `now` to `nextExpectedDate`; a null date falls back to 0 (treated as due
 * now) so the bill still surfaces rather than vanishing.
 */
export function toBillItem(bill: UpcomingBill, now: Date): BillItem {
  const daysUntil =
    bill.nextExpectedDate === null
      ? 0
      : Math.round(
          (new Date(bill.nextExpectedDate).getTime() - now.getTime()) / MS_PER_DAY,
        );
  return {
    id: bill.id,
    name: bill.name,
    sub: bill.merchant ?? bill.category ?? undefined,
    cents: bill.amountCents,
    daysUntil,
  };
}

const GRID_GAP = 16;

function Row({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: GRID_GAP,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Presentational Today dashboard. Data arrives via props; no DB/auth/hooks.
 * Phase-3 reality: only net worth, upcoming bills and sync health have real
 * sources — the budget/forecast surfaces render honest "coming soon" empty
 * states rather than fabricated numbers.
 */
export function DashCalm({ data }: { data: TodayData }) {
  const now = new Date();
  const syncState = syncHealthToState(data.syncHealth);
  const bills = data.upcomingBills.map((b) => toBillItem(b, now));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: GRID_GAP, marginTop: 18 }}>
      {/* Hero — safe-to-spend / health spectrum (no source yet) */}
      <Card>
        <CardHeader>
          <CardTitle>Safe to spend</CardTitle>
          <SyncStatus state={syncState} />
        </CardHeader>
        <CardBody>
          <EmptyState
            icon="wallet"
            title="Coming soon"
            hint="Safe-to-spend and your health spectrum arrive with budgets in a later phase."
            suggested
          />
        </CardBody>
      </Card>

      {/* Row 1 — net worth (real), cashflow forecast, emergency-fund readiness */}
      <Row>
        <Link href="/net-worth" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
          <Card>
            <CardHeader>
              <CardTitle>Net worth</CardTitle>
            </CardHeader>
            <CardBody>
              <Money cents={data.netWorthCents} kind="neutral" size={28} weight={700} />
            </CardBody>
          </Card>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Cashflow forecast</CardTitle>
          </CardHeader>
          <CardBody>
            <EmptyState
              icon="trend"
              title="Coming soon"
              hint="Forecasting lands with the budget phase."
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Emergency fund</CardTitle>
          </CardHeader>
          <CardBody>
            <EmptyState
              icon="shield"
              title="Coming soon"
              hint="Readiness needs budget targets, due in a later phase."
            />
          </CardBody>
        </Card>
      </Row>

      {/* Row 2 — envelopes, upcoming bills (real), insights */}
      <Row>
        <Card>
          <CardHeader>
            <CardTitle>Envelopes</CardTitle>
          </CardHeader>
          <CardBody>
            <EmptyState
              icon="plan"
              title="Coming soon"
              hint="Envelope budgeting arrives in a later phase."
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coming up</CardTitle>
          </CardHeader>
          <CardBody>
            {bills.length > 0 ? (
              <UpcomingBills bills={bills} />
            ) : (
              <EmptyState
                icon="clock"
                title="No upcoming bills"
                hint="Recurring bills appear here once detected."
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>For you</CardTitle>
          </CardHeader>
          <CardBody>
            <EmptyState
              icon="flag"
              title="Nothing for you yet"
              hint="Insights appear here as Upshot learns your spending."
            />
          </CardBody>
        </Card>
      </Row>
    </div>
  );
}
