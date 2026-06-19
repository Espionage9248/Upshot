"use client";

import { useState, useTransition } from "react";
import { Card, Button } from "@upshot/ui";
import { setSaverGoalAction } from "@/server-actions/savers";

/**
 * Serializable saver-goal row. Re-declared locally (NOT imported from
 * savers-core, which transitively pulls in @upshot/db) so this client component
 * never reaches the db layer — the RSC page passes plain objects.
 */
type SaverGoalRow = {
  id: string;
  name: string;
  goalTargetCents: number | null;
  goalTargetDate: string | null;
};

/** Parse a dollar string to integer cents; null when not a valid non-negative amount. */
function dollarsToCents(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  return Math.round(Number(trimmed) * 100);
}

const inputStyle: React.CSSProperties = {
  height: 38,
  padding: "0 12px",
  borderRadius: "var(--radius-data)",
  border: "1px solid var(--line)",
  background: "var(--surface-2)",
  color: "var(--text)",
  fontSize: 13.5,
};

/**
 * Per-saver goal entry. Each saver gets a target-amount + target-date row with
 * its own Save button. A goal is meaningful only with BOTH fields (A4 derives
 * months-to-target from the date), so we enforce the invariant
 * goalTargetCents != null <=> goalTargetDate != null at submit time:
 *   - both filled & amount valid -> set the goal
 *   - both empty               -> clear the goal (null, null)
 *   - exactly one (or bad amount) -> inline error, no action call
 *
 * Client component: serializable props only, never imports @upshot/db.
 */
function SaverGoalForm({ saver }: { saver: SaverGoalRow }) {
  const [amount, setAmount] = useState(
    saver.goalTargetCents !== null ? (saver.goalTargetCents / 100).toFixed(2) : "",
  );
  const [date, setDate] = useState(saver.goalTargetDate ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    const amountTrimmed = amount.trim();
    const dateTrimmed = date.trim();

    // Clear: both empty.
    if (amountTrimmed === "" && dateTrimmed === "") {
      startTransition(async () => {
        const res = await setSaverGoalAction(saver.id, null, null);
        if (!res.ok) setError(res.error.message);
      });
      return;
    }

    // Set: require both, with a valid amount.
    const cents = dollarsToCents(amountTrimmed);
    if (cents === null || dateTrimmed === "") {
      setError("Enter both a target amount and date, or clear both.");
      return;
    }
    startTransition(async () => {
      const res = await setSaverGoalAction(saver.id, cents, dateTrimmed);
      if (!res.ok) setError(res.error.message);
    });
  }

  const amountId = `goal-amount-${saver.id}`;
  const dateId = `goal-date-${saver.id}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>{saver.name}</div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 10 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label htmlFor={amountId} style={{ fontSize: 12, fontWeight: 500, color: "var(--text-2)" }}>
            {saver.name} target amount
          </label>
          <input
            id={amountId}
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label htmlFor={dateId} style={{ fontSize: 12, fontWeight: 500, color: "var(--text-2)" }}>
            {saver.name} target date
          </label>
          <input
            id={dateId}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={inputStyle}
          />
        </div>
        <Button size="md" onClick={submit} loading={pending} aria-label={`Save ${saver.name}`}>
          Save
        </Button>
      </div>
      {error && (
        <div style={{ fontSize: 11.5, color: "var(--expense)" }}>{error}</div>
      )}
    </div>
  );
}

export function BudgetSettings({ savers }: { savers: SaverGoalRow[] }) {
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
        Saver goals
      </div>

      {savers.length === 0 ? (
        <div style={{ fontSize: 12.5, color: "var(--text-3)" }}>No saver accounts yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {savers.map((saver) => (
            <SaverGoalForm key={saver.id} saver={saver} />
          ))}
        </div>
      )}
    </Card>
  );
}
