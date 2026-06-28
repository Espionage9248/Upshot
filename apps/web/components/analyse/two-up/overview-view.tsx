import type { ReactElement } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardBody, Money } from "@upshot/ui";
import type { TwoUpOverview } from "@upshot/core";
import { ContributorPanel } from "./contributor-panel";
import { SplitBar } from "./split-bar";
import { CatTotals } from "./cat-totals";

const JAMES_COLOR = "var(--viz-2)";
const BRITT_COLOR = "var(--viz-4)";

function RhythmSparkline({ rhythm }: { rhythm: { month: string; totalInCents: number }[] }): ReactElement {
  const W = 120;
  const H = 32;
  const points = rhythm.map((p) => p.totalInCents);
  if (points.length < 2) {
    return <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" />;
  }
  const max = Math.max(...points);
  const min = Math.min(...points);
  const rng = max - min || 1;
  const X = (i: number) => ((i / (points.length - 1)) * W).toFixed(1);
  const Y = (v: number) => (H - ((v - min) / rng) * (H - 4) - 2).toFixed(1);
  const d = points.map((v, i) => `${X(i)},${Y(v)}`).join(" ");
  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      fill="none"
      aria-hidden="true"
      style={{ display: "block", overflow: "visible" }}
    >
      <polyline
        points={d}
        stroke="var(--viz-2)"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function OverviewView({ data }: { data: TwoUpOverview }): ReactElement {
  const { james, britt, settlement, jamesPct, brittPct, rhythm, categories } = data;
  const maxContrib = Math.max(james.putInCents, britt.putInCents, 1);

  // Settlement callout — positive means James contributed more (Britt owes James)
  const absOwed = Math.abs(settlement.whoOwedWhomCents);
  const debtor = settlement.whoOwedWhomCents > 0 ? "Britt" : "James";
  const creditor = settlement.whoOwedWhomCents > 0 ? "James" : "Britt";

  const catMax = categories.length > 0 ? categories[0]!.cents : 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <Card>
          <CardHeader>
            <CardTitle>Total put in</CardTitle>
          </CardHeader>
          <CardBody>
            <Money cents={data.totalInCents} kind="income" size={26} weight={700} showCents={false} arrow={false} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total spent</CardTitle>
          </CardHeader>
          <CardBody>
            <Money cents={data.totalSpentCents} kind="expense" size={26} weight={700} showCents={false} arrow={false} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distributed at close</CardTitle>
          </CardHeader>
          <CardBody>
            <Money
              cents={data.distributedCents}
              kind={data.distributedCents >= 0 ? "income" : "expense"}
              size={26}
              weight={700}
              showCents={false}
              arrow={false}
            />
          </CardBody>
        </Card>
      </div>

      {/* ── Per-person panels ────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Contributors</CardTitle>
        </CardHeader>
        <CardBody>
          <div style={{ display: "flex", gap: 24 }}>
            <ContributorPanel
              name="James"
              color={JAMES_COLOR}
              putInCents={james.putInCents}
              shareOfCostsCents={james.shareOfCostsCents}
              netCents={james.netCents}
              maxCents={maxContrib}
            />
            <div style={{ width: 1, background: "var(--line-soft)", flexShrink: 0 }} />
            <ContributorPanel
              name="Britt"
              color={BRITT_COLOR}
              putInCents={britt.putInCents}
              shareOfCostsCents={britt.shareOfCostsCents}
              netCents={britt.netCents}
              maxCents={maxContrib}
            />
          </div>

          {/* Settlement callout */}
          {absOwed > 0 && (
            <div
              style={{
                marginTop: 16,
                padding: "10px 14px",
                borderRadius: 8,
                background: "var(--surface-2)",
                fontSize: 13,
                color: "var(--text-2)",
              }}
            >
              Settled at close —{" "}
              <span style={{ fontWeight: 700, color: "var(--text)" }}>{debtor}</span> owed{" "}
              <span style={{ fontWeight: 700, color: "var(--text)" }}>{creditor}</span>{" "}
              <Money cents={absOwed} kind="neutral" size={13} weight={700} showCents={true} arrow={false} />
            </div>
          )}
          {absOwed === 0 && (
            <div
              style={{
                marginTop: 16,
                padding: "10px 14px",
                borderRadius: 8,
                background: "var(--surface-2)",
                fontSize: 13,
                color: "var(--text-3)",
              }}
            >
              Settled at close — contributions were equal
            </div>
          )}
        </CardBody>
      </Card>

      {/* ── Who contributed ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Who contributed</CardTitle>
        </CardHeader>
        <CardBody>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: "var(--viz-2)", fontWeight: 700 }}>
              James {jamesPct.toFixed(0)}%
            </span>
            <div style={{ flex: 1 }}>
              <SplitBar
                aCents={james.putInCents}
                bCents={britt.putInCents}
                ca={JAMES_COLOR}
                cb={BRITT_COLOR}
              />
            </div>
            <span style={{ fontSize: 12, color: "var(--viz-4)", fontWeight: 700 }}>
              {brittPct.toFixed(0)}% Britt
            </span>
          </div>

          {/* Rhythm sparkline */}
          {rhythm.length >= 2 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", marginBottom: 6, fontWeight: 600 }}>
                Monthly inflow
              </div>
              <RhythmSparkline rhythm={rhythm} />
            </div>
          )}
        </CardBody>
      </Card>

      {/* ── Where it went ────────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Where it went</CardTitle>
          </CardHeader>
          <CardBody>
            <CatTotals rows={categories} maxCents={catMax} />
          </CardBody>
        </Card>
      )}

      {/* ── Open ledger link ─────────────────────────────────────────────── */}
      <div style={{ marginTop: 4 }}>
        <Link
          href="/analyse/2up/ledger"
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: "var(--coral)",
            textDecoration: "none",
          }}
        >
          Open ledger →
        </Link>
      </div>
    </div>
  );
}
