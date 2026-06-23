import { DrizzleDebtRepo, tables, type DbClient } from "@upshot/db";
import { computeSnowball, type DebtStrategy, type SnowballAnalysis, type PayoffSchedule } from "@upshot/core";
import type { DebtRow } from "../data";

export interface DebtDetailData {
  debt: DebtRow;
  schedule: PayoffSchedule | null;
  analysis: SnowballAnalysis;
}

function toStrategy(raw: string): DebtStrategy {
  if (raw === "SNOWBALL" || raw === "AVALANCHE" || raw === "CUSTOM") return raw;
  return "CUSTOM";
}

function monthOf(d: Date): string {
  return d.toISOString().slice(0, 7);
}

export async function loadDebtDetail(
  db: DbClient,
  id: string,
  now: Date = new Date(),
): Promise<DebtDetailData | null> {
  const repo = new DrizzleDebtRepo(db);
  const debt = await repo.getById(id);
  if (!debt) return null;

  const startMonth = monthOf(now);

  const settings = db
    .select({ debtStrategy: tables.appSettings.debtStrategy, extraPaymentCents: tables.appSettings.extraPaymentCents })
    .from(tables.appSettings)
    .get();

  const strategy = toStrategy(settings?.debtStrategy ?? "SNOWBALL");
  const extraPaymentCents = settings?.extraPaymentCents ?? 0;

  const allDebts = await repo.list();
  const debtInputs = allDebts.map((row) => ({
    id: row.id,
    name: row.name,
    currentBalanceCents: row.currentBalanceCents,
    monthlyPaymentCents: row.monthlyPaymentCents,
    interestRate: row.interestRate ?? null,
    payoffPriority: row.payoffPriority,
    includeInSnowball: row.includeInSnowball,
  }));

  const analysis = computeSnowball(debtInputs, { strategy, extraPaymentCents, startMonth });
  const schedule = analysis.schedules.find((s) => s.debtId === id) ?? null;

  return { debt, schedule, analysis };
}
