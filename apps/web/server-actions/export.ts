"use server";

import { action } from "@/lib/action";
import { getDb } from "@/lib/db";
import { buildTaxCsv, buildReportCsv } from "./export-core";
import type { ReportView } from "@/app/(app)/analyse/data";

export const exportTaxCsvAction = action(async () => {
  const { db } = getDb();
  return buildTaxCsv(db, { now: new Date().toISOString() });
});

export const exportReportCsvAction = action(
  async (
    _session,
    input: { view: ReportView; periodIndex: number; year?: number },
  ) => {
    const { db } = getDb();
    return buildReportCsv(db, { ...input, now: new Date().toISOString() });
  },
);

export type { ReportView } from "@/app/(app)/analyse/data";
