// packages/core/src/twoup/reconcile.test.ts
import { describe, it, expect } from "vitest";
import { reconcileStatement } from "./reconcile";
import type { RawRow, StatementSummary } from "./types";

const summary: StatementSummary = { openingCents: 1000, moneyInCents: 200000, moneyOutCents: 104250, closingCents: 96750 };
const rows: RawRow[] = [
  { date: "2023-03-14", time: "8:05am", description: "Acme Payroll", amountCents: 200000, balanceCents: 201000 },
  { date: "2023-03-14", time: "9:30am", description: "Coles", amountCents: -104250, balanceCents: 96750 },
];

describe("reconcileStatement", () => {
  it("passes when running balance + summary reconcile to the cent", () => {
    const r = reconcileStatement(rows, summary);
    expect(r.ok).toBe(true);
    expect(r.rowCount).toBe(2);
    expect(r.errors).toEqual([]);
  });
  it("fails on a one-cent running-balance break", () => {
    const bad = [rows[0]!, { ...rows[1]!, balanceCents: 96749 }];
    const r = reconcileStatement(bad, summary);
    expect(r.ok).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });
  it("fails when money-in total disagrees with the summary", () => {
    const r = reconcileStatement(rows, { ...summary, moneyInCents: 199999 });
    expect(r.ok).toBe(false);
  });
});
