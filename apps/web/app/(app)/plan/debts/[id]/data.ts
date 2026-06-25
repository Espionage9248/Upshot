import { DrizzleDebtRepo, DrizzleCategoryRepo, DrizzleRecurringRepo, DrizzleInstallmentRepo, tables, type DbClient } from "@upshot/db";
import { computeSnowball, effectiveDebtPaymentCents, type DebtStrategy, type SnowballAnalysis, type PayoffSchedule } from "@upshot/core";
import type { UiSelectOption } from "@upshot/ui";
import type { DebtRow } from "../data";

export interface DebtDetailData {
  debt: DebtRow;
  schedule: PayoffSchedule | null;
  analysis: SnowballAnalysis;
  effectivePaymentCents: number;
  paymentIsActual: boolean;
  ruleOptions: {
    categoryOptions: UiSelectOption[];
    tagOptions: UiSelectOption[];
    debtOptions: UiSelectOption[];
    recurringOptions: UiSelectOption[];
    installmentOptions: UiSelectOption[];
  };
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

  const latest = await repo.latestPaymentCentsByDebt();
  const actual = latest.get(id)?.amountCents ?? null;
  const effectivePaymentCents = effectiveDebtPaymentCents({
    actualPaymentCents: actual,
    minimumPaymentCents: debt.minimumPaymentCents ?? null,
    monthlyPaymentCents: debt.monthlyPaymentCents,
  });
  const paymentIsActual = actual !== null;

  const categoryOptions = (await new DrizzleCategoryRepo(db).list()).map((c) => ({ value: c.id, label: c.name }));
  const tagOptions = db.select({ id: tables.tags.id }).from(tables.tags).all().map((t) => ({ value: t.id, label: t.id }));
  const debtOptions = allDebts.map((d) => ({ value: d.id, label: d.name }));
  const recurringOptions = (await new DrizzleRecurringRepo(db).list()).map((i) => ({ value: i.id, label: i.name }));
  const installmentOptions = (await new DrizzleInstallmentRepo(db).list()).map((p) => ({ value: p.id, label: p.merchant }));

  return { debt, schedule, analysis, effectivePaymentCents, paymentIsActual, ruleOptions: { categoryOptions, tagOptions, debtOptions, recurringOptions, installmentOptions } };
}
