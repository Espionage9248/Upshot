import type { TaxEstimate } from "../tax";
import type { YearlyReport, MonthlyReport } from "../reports";

/** Cents → plain dollar string for CSV cells. Edge formatting, not money math. */
function dollars(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

/** RFC-4180-ish CSV cell escaping. */
function cell(value: string | number): string {
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Generic CSV builder: headers + rows, CRLF-joined. */
export function toCsv(headers: string[], rows: (string | number)[][]): string {
  const lines = [headers.map(cell).join(",")];
  for (const row of rows) lines.push(row.map(cell).join(","));
  return lines.join("\r\n");
}

/** Tax estimate → CSV (summary block + deductible-by-category). */
export function taxEstimateToCsv(e: TaxEstimate): string {
  const summary = toCsv(
    ["Field", "Value"],
    [
      ["Financial year", `FY${e.fy - 1}-${String(e.fy).slice(2)}`],
      ["Deductible total", dollars(e.totalDeductibleCents)],
      ["Flagged transactions", e.flaggedCount],
      ["Gross income", dollars(e.grossIncomeCents)],
      ["Taxable income", dollars(e.taxableIncomeCents)],
      ["Income tax", dollars(e.incomeTaxCents)],
      ["Medicare levy", dollars(e.medicareLevyCents)],
      ["LITO", dollars(e.litoCents)],
      ["Estimated liability", dollars(e.liabilityCents)],
      ["PAYG withheld", dollars(e.paygWithheldCents)],
      ["Estimated refund position", dollars(e.refundPositionCents)],
      ["Estimated deduction benefit", dollars(e.deductionBenefitCents)],
    ],
  );
  const byCat = toCsv(
    ["Category", "Amount", "Transactions"],
    e.byCategory.map((g) => [g.category, dollars(g.cents), g.count]),
  );
  return `${summary}\r\n\r\nDeductible by category\r\n${byCat}`;
}

/** Yearly / FY report → CSV (monthly breakdown). */
export function yearlyReportToCsv(r: YearlyReport): string {
  return toCsv(
    ["Month", "Income", "Expenses", "Net", "Savings rate %"],
    r.monthlyBreakdown.map((m) => [
      m.month,
      dollars(m.incomeCents),
      dollars(m.expensesCents),
      dollars(m.netCents),
      (m.savingsRate * 100).toFixed(1),
    ]),
  );
}

/** Monthly report → CSV (category breakdown). */
export function monthlyReportToCsv(r: MonthlyReport): string {
  return toCsv(
    ["Category", "Amount", "Transactions"],
    r.categoryBreakdown.map((c) => [c.categoryName, dollars(c.totalCents), c.transactionCount]),
  );
}
