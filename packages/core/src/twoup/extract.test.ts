import { describe, it, expect } from "vitest";
import { assembleTransactions, DEFAULT_BANDS } from "./extract";
import type { PositionedText } from "./types";

// y descending = top of page first. One day header, two transactions:
//  txn A: 9:30am, "Coles Burwood", -$42.50, bal $957.50
//  txn B: 8:05am, "Acme Payroll", +$2,000.00, bal $1,000.00  (note: chronological within day)
const items: PositionedText[] = [
  { x: 39, y: 700, str: "Tuesday, 14 Mar" },
  { x: 88, y: 686, str: "Coles" }, { x: 120, y: 686, str: "Burwood" },
  { x: 35, y: 680, str: "9:30am" }, { x: 470, y: 680, str: "$42.50" }, { x: 543, y: 680, str: "$957.50" },
  { x: 88, y: 658, str: "Acme Payroll" },
  { x: 35, y: 652, str: "8:05am" }, { x: 466, y: 652, str: "+$2,000.00" }, { x: 544, y: 652, str: "$1,000.00" },
];

describe("assembleTransactions", () => {
  const rows = assembleTransactions(items, { year: 2023, bands: DEFAULT_BANDS });

  it("produces one row per transaction", () => {
    expect(rows).toHaveLength(2);
  });
  it("assembles the debit row with a negative amount and the correct date/time/balance", () => {
    expect(rows[0]).toEqual({
      date: "2023-03-14", time: "9:30am",
      description: "Coles Burwood", amountCents: -4250, balanceCents: 95750,
    });
  });
  it("assembles the credit row with a positive amount", () => {
    expect(rows[1]).toMatchObject({
      time: "8:05am", description: "Acme Payroll", amountCents: 200000, balanceCents: 100000,
    });
  });
  it("never bleeds a description across transactions", () => {
    expect(rows[0]!.description).not.toContain("Acme");
    expect(rows[1]!.description).not.toContain("Coles");
  });
});
