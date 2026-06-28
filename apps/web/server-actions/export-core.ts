import { taxEstimateToCsv, yearlyReportToCsv, monthlyReportToCsv } from "@upshot/core";
import type { DbClient } from "@upshot/db";
import { loadTaxData } from "@/app/(app)/analyse/tax/data";
import { loadReportsData, type ReportView } from "@/app/(app)/analyse/data";

export async function buildTaxCsv(
  db: DbClient,
  opts: { now: string },
): Promise<{ filename: string; csv: string }> {
  const data = await loadTaxData(db, { now: opts.now });
  return {
    filename: `upshot-tax-${data.fyLabel}.csv`,
    csv: taxEstimateToCsv(data.estimate),
  };
}

export async function buildReportCsv(
  db: DbClient,
  opts: { view: ReportView; periodIndex: number; now: string; year?: number },
): Promise<{ filename: string; csv: string }> {
  const data = await loadReportsData(db, opts);

  if (data.view === "month") {
    // SalaryPeriod.label is e.g. "15 Jan – 14 Feb 2026" — use it as the tag.
    const tag = data.report.period.label.replace(/[/\\?%*:|"<>]/g, "-");
    return {
      filename: `upshot-report-${tag}.csv`,
      csv: monthlyReportToCsv(data.report),
    };
  }

  // year | fy view — selectedYear is always set for these views.
  const yr = data.selectedYear ?? new Date(opts.now).getUTCFullYear();
  const tag =
    data.view === "fy"
      ? `FY${yr - 1}-${String(yr).slice(2)}`
      : String(yr);

  return {
    filename: `upshot-report-${tag}.csv`,
    csv: yearlyReportToCsv(data.yearlyReport!),
  };
}
