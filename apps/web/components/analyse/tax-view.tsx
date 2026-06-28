import type { ReactElement } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardBody, Money } from "@upshot/ui";
import type { TaxData } from "@/app/(app)/analyse/tax/data";
import { exportTaxCsvAction } from "@/server-actions/export";
import { ExportButton, PrintButton } from "@/components/export-button";

interface TaxViewProps {
  data: TaxData;
}

/**
 * TaxView — presentational component for /analyse/tax.
 *
 * Three stat cards (Deductible total · Est. deduction benefit · Est. refund
 * position) over a Deductible-by-category table. When hasIncomeInputs is
 * false the benefit + refund cards are replaced by a prompt card linking to
 * /settings/tax.
 */
export function TaxView({ data }: TaxViewProps): ReactElement {
  const { estimate, fyLabel, daysToEofy, hasIncomeInputs } = data;
  const marginalRatePct = `${estimate.marginalRateBps / 100}%`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12.5,
              color: "var(--text-3)",
              fontWeight: 600,
              marginBottom: 4,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            ANALYSE · {fyLabel} · {daysToEofy} DAYS TO EOFY
          </div>
          <div
            style={{
              fontSize: 27,
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            Tax time
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: "var(--text-3)",
              marginTop: 4,
            }}
          >
            Estimate only · not tax advice
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <ExportButton onExport={exportTaxCsvAction} />
          <PrintButton />
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 14,
        }}
      >
        {/* Card 1: Deductible total — always shown */}
        <Card style={{ borderTop: "2px solid var(--coral)" }}>
          <CardHeader>
            <CardTitle>Deductible total</CardTitle>
          </CardHeader>
          <CardBody>
            <div style={{ marginTop: 2 }}>
              <Money
                cents={estimate.totalDeductibleCents}
                kind="expense"
                size={28}
                weight={700}
                showCents={false}
                arrow={false}
                quiet
              />
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 4 }}>
              {estimate.flaggedCount} flagged transaction
              {estimate.flaggedCount !== 1 ? "s" : ""}
            </div>
          </CardBody>
        </Card>

        {hasIncomeInputs ? (
          <>
            {/* Card 2: Est. deduction benefit */}
            <Card style={{ borderTop: "2px solid var(--income)" }}>
              <CardHeader>
                <CardTitle>Est. deduction benefit</CardTitle>
              </CardHeader>
              <CardBody>
                <div style={{ marginTop: 2 }}>
                  <Money
                    cents={estimate.deductionBenefitCents}
                    kind="income"
                    size={28}
                    weight={700}
                    showCents={false}
                    arrow={false}
                  />
                </div>
                <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 4 }}>
                  at {marginalRatePct} marginal rate
                </div>
              </CardBody>
            </Card>

            {/* Card 3: Est. refund position */}
            <Card>
              <CardHeader>
                <CardTitle>Est. refund position</CardTitle>
              </CardHeader>
              <CardBody>
                <div style={{ marginTop: 2 }}>
                  <Money
                    cents={estimate.refundPositionCents}
                    kind={estimate.refundPositionCents >= 0 ? "income" : "expense"}
                    size={28}
                    weight={700}
                    showCents={false}
                    arrow={false}
                  />
                </div>
                <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 4 }}>
                  estimate · not advice
                </div>
              </CardBody>
            </Card>
          </>
        ) : (
          /* Prompt card: spans 2 columns when no income inputs */
          <Card style={{ gridColumn: "span 2" }}>
            <CardBody>
              <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.5 }}>
                Add your income &amp; PAYG withheld in{" "}
                <Link
                  href="/settings/tax"
                  style={{
                    color: "var(--coral-text)",
                    fontWeight: 600,
                    textDecoration: "underline",
                  }}
                >
                  Settings → Tax
                </Link>{" "}
                to estimate your refund.
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {/* ── Deductible by category table ────────────────────────────────── */}
      <Card style={{ overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 18px",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <CardTitle>Deductible by category</CardTitle>
          <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>
            Estimate only · confirm with your accountant
          </span>
        </div>

        {estimate.byCategory.length === 0 ? (
          <div
            style={{
              padding: "24px 18px",
              fontSize: 13,
              color: "var(--text-3)",
              textAlign: "center",
            }}
          >
            No deductible transactions found for {fyLabel}.
          </div>
        ) : (
          estimate.byCategory.map((row) => (
            <div
              key={row.category}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 18px",
                borderBottom: "1px solid var(--line-soft)",
              }}
            >
              {/* Category icon bubble */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "var(--surface-2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--coral-text)",
                  flexShrink: 0,
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                {row.category.charAt(0).toUpperCase()}
              </div>

              {/* Category name + count */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{row.category}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>
                  {row.count} transaction{row.count !== 1 ? "s" : ""}
                </div>
              </div>

              {/* Amount */}
              <div>
                <Money
                  cents={row.cents}
                  kind="expense"
                  size={15}
                  weight={700}
                  showCents={false}
                  arrow={false}
                  quiet
                />
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
