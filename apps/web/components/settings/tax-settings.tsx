"use client";

import { useState, useTransition } from "react";
import { Card, ToggleRow } from "@upshot/ui";
import { updateTaxSettingsAction } from "@/server-actions/settings";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Tax settings: financial-year start month + Medicare levy toggle. Optimistic
 * local state, reverting on a failed ActionResult (mirrors ConnectionsForm).
 *
 * The FY-month control is a native, token-styled <select> rather than the Radix
 * UiSelect: it keeps the control fully labelled + keyboard/test-driveable (the
 * Radix portal is awkward to drive in jsdom) without the chip vocabulary the
 * rule builder needs. Client component — serializable props only.
 */
export function TaxSettings({
  financialYearStartMonth,
  medicareLevyApplies,
}: {
  financialYearStartMonth: number;
  medicareLevyApplies: boolean;
}) {
  const [fyMonth, setFyMonth] = useState(financialYearStartMonth);
  const [medicare, setMedicare] = useState(medicareLevyApplies);
  const [, startTransition] = useTransition();

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

  return (
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
  );
}
