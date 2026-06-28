// Integer cents only. Never parseFloat a money value.

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/** Signed integer cents from a money token. Explicit +/- respected; bare = positive. */
export function parseMoneyCents(token: string): number {
  const t = token.trim();
  const negative = t.startsWith("-");
  const digits = t.replace(/[^0-9.]/g, ""); // strip $ , + - whitespace
  const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(digits);
  if (!m) throw new RangeError(`Invalid money token: "${token}"`);
  const cents = Number(m[1]) * 100 + Number((m[2] ?? "").padEnd(2, "0"));
  return negative ? -cents : cents;
}

/** Ledger amount column: "+$X" = credit (positive); bare/"-$X" = debit (negative). */
export function parseAmountCents(token: string): number {
  const mag = Math.abs(parseMoneyCents(token));
  return token.trim().startsWith("+") ? mag : -mag;
}

/** "Weekday, DD Mon" + FY-year → "YYYY-MM-DD". */
export function parseStatementDate(header: string, fyYear: number): string {
  const m = /(\d{1,2})\s+([A-Za-z]{3})/.exec(header);
  if (!m) throw new RangeError(`Invalid day header: "${header}"`);
  const day = Number(m[1]);
  const mon = MONTHS[m[2]!.toLowerCase()];
  if (!mon) throw new RangeError(`Invalid month: "${m[2]}"`);
  return `${fyYear}-${String(mon).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
