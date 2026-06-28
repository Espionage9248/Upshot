"use client";

import { useState, useTransition } from "react";
import { Card, ToggleRow } from "@upshot/ui";
import { updateTaxSettingsAction, updateTaxIncomeAction } from "@/server-actions/settings";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function dollarsToCents(value: string): number | null {
  const t = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  return Math.round(Number(t) * 100);
}

function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Tax settings: financial-year start month + Medicare levy toggle + income
 * inputs (taxable gross income + PAYG withheld). Optimistic local state,
 * reverting on a failed ActionResult (mirrors ConnectionsForm).
 *
 * The FY-month control is a native, token-styled <select> rather than the Radix
 * UiSelect: it keeps the control fully labelled + keyboard/test-driveable (the
 * Radix portal is awkward to drive in jsdom) without the chip vocabulary the
 * rule builder needs. Client component — serializable props only.
 */
export function TaxSettings({
  financialYearStartMonth,
  medicareLevyApplies,
  taxableIncomeGrossCents,
  paygWithheldCents,
}: {
  financialYearStartMonth: number;
  medicareLevyApplies: boolean;
  taxableIncomeGrossCents: number;
  paygWithheldCents: number;
}) {
  const [fyMonth, setFyMonth] = useState(financialYearStartMonth);
  const [medicare, setMedicare] = useState(medicareLevyApplies);
  const [, startTransition] = useTransition();

  const [grossValue, setGrossValue] = useState(() => centsToDollars(taxableIncomeGrossCents));
  const [paygValue, setPaygValue] = useState(() => centsToDollars(paygWithheldCents));
  const [, startIncomeTransition] = useTransition();

  function persist(next: { financialYearStartMonth: number; medicareLevyApplies: boolean }) {
    startTransition(async () => {
      const res = await updateTaxSettingsAction(next);
      if (!res.ok) {
        setFyMonth(financialYearStartMonth);
        setMedicare(medicareLevyApplies);
      }
    });
  }

  function onFyMonth(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = Number.parseInt(e.target.value, 10);
    setFyMonth(value);
    persist({ financialYearStartMonth: value, medicareLevyApplies: medicare });
  }

  function onMedicare(on: boolean) {
    setMedicare(on);
    persist({ financialYearStartMonth: fyMonth, medicareLevyApplies: on });
  }

  function persistIncome(gross: string, payg: string) {
    const grossCents = dollarsToCents(gross);
    const paygCents = dollarsToCents(payg);
    if (grossCents === null || paygCents === null) return;
    startIncomeTransition(async () => {
      const res = await updateTaxIncomeAction({
        taxableIncomeGrossCents: grossCents,
        paygWithheldCents: paygCents,
      });
      if (!res.ok) {
        setGrossValue(centsToDollars(taxableIncomeGrossCents));
        setPaygValue(centsToDollars(paygWithheldCents));
      }
    });
  }

  return (
    <>
      <Card className="p-4">
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.09em",
            color: "var(--text-3)",
            marginBottom: 12,
          }}
        >
          Tax estimates
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
          <label htmlFor="fy-start-month" style={{ fontSize: 12, fontWeight: 500, color: "var(--text-2)" }}>
            Financial year starts
          </label>
          <select
            id="fy-start-month"
            value={fyMonth}
            onChange={onFyMonth}
            style={{
              height: 38,
              padding: "0 12px",
              borderRadius: "var(--radius-data)",
              border: "1px solid var(--line)",
              background: "var(--surface-2)",
              color: "var(--text)",
              fontSize: 13.5,
            }}
          >
            {MONTHS.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <ToggleRow
          label="Medicare levy applies"
          sub="Include the 2% Medicare levy in tax estimates"
          checked={medicare}
          onCheckedChange={onMedicare}
        />
      </Card>

      <Card className="p-4">
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.09em",
            color: "var(--text-3)",
            marginBottom: 12,
          }}
        >
          Income &amp; PAYG (this financial year)
        </div>

        <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 12 }}>
          From your payslips or PAYG summary — the bank can&apos;t see these.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label htmlFor="taxable-income-gross" style={{ fontSize: 12, fontWeight: 500, color: "var(--text-2)" }}>
              Estimated gross income
            </label>
            <input
              id="taxable-income-gross"
              type="text"
              inputMode="decimal"
              value={grossValue}
              onChange={(e) => setGrossValue(e.target.value)}
              onBlur={() => persistIncome(grossValue, paygValue)}
              style={{
                height: 38,
                padding: "0 12px",
                borderRadius: "var(--radius-data)",
                border: "1px solid var(--line)",
                background: "var(--surface-2)",
                color: "var(--text)",
                fontSize: 13.5,
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label htmlFor="payg-withheld" style={{ fontSize: 12, fontWeight: 500, color: "var(--text-2)" }}>
              PAYG tax withheld
            </label>
            <input
              id="payg-withheld"
              type="text"
              inputMode="decimal"
              value={paygValue}
              onChange={(e) => setPaygValue(e.target.value)}
              onBlur={() => persistIncome(grossValue, paygValue)}
              style={{
                height: 38,
                padding: "0 12px",
                borderRadius: "var(--radius-data)",
                border: "1px solid var(--line)",
                background: "var(--surface-2)",
                color: "var(--text)",
                fontSize: 13.5,
              }}
            />
          </div>
        </div>
      </Card>
    </>
  );
}
