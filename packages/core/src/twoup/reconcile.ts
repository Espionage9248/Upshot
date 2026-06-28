import type { RawRow, StatementSummary } from "./types";

export interface ReconResult {
  ok: boolean;
  rowCount: number;
  errors: string[];
}

export function reconcileStatement(
  rows: RawRow[],
  summary: StatementSummary
): ReconResult {
  const errors: string[] = [];

  // Check 1: running balance — seed from openingCents; each balance[i] === balance[i-1] + amountCents[i]
  let running = summary.openingCents;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    running = running + row.amountCents;
    if (running !== row.balanceCents) {
      errors.push(
        `Row ${i}: running balance expected ${running} but got ${row.balanceCents}`
      );
    }
  }

  // Check 2: last row's balanceCents === closingCents
  if (rows.length > 0) {
    const lastRow = rows[rows.length - 1]!;
    if (lastRow.balanceCents !== summary.closingCents) {
      errors.push(
        `Last row balance ${lastRow.balanceCents} !== closingCents ${summary.closingCents}`
      );
    }
  }

  // Compute totals for checks 3 and 4
  let totalIn = 0;
  let totalOut = 0;
  for (const row of rows) {
    if (row.amountCents > 0) {
      totalIn += row.amountCents;
    } else if (row.amountCents < 0) {
      totalOut += -row.amountCents;
    }
  }

  // Check 3: summary identity — openingCents + Σ(amount>0) − Σ|amount<0| === closingCents
  const identityResult = summary.openingCents + totalIn - totalOut;
  if (identityResult !== summary.closingCents) {
    errors.push(
      `Summary identity: ${summary.openingCents} + ${totalIn} - ${totalOut} = ${identityResult} !== closingCents ${summary.closingCents}`
    );
  }

  // Check 4: Σ(amount>0) === moneyInCents AND Σ|amount<0| === moneyOutCents
  if (totalIn !== summary.moneyInCents) {
    errors.push(
      `Money-in total ${totalIn} !== moneyInCents ${summary.moneyInCents}`
    );
  }
  if (totalOut !== summary.moneyOutCents) {
    errors.push(
      `Money-out total ${totalOut} !== moneyOutCents ${summary.moneyOutCents}`
    );
  }

  return { ok: errors.length === 0, rowCount: rows.length, errors };
}
