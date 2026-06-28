import type { ReactNode } from "react";
import { getDb } from "@/lib/db";
import { loadSettings } from "@/server-actions/settings-core";
import { TaxSettings } from "@/components/settings/tax-settings";

// Reads the encrypted DB at request time, so this route must never be
// statically prerendered (mirrors settings/page.tsx).
export const dynamic = "force-dynamic";

/** Defaults for a fresh, unseeded DB (no app_settings row yet). */
const DEFAULTS = {
  financialYearStartMonth: 7,
  medicareLevyApplies: true,
  taxableIncomeGrossCents: 0,
  paygWithheldCents: 0,
} as const;

export default async function TaxPage(): Promise<ReactNode> {
  const { db } = getDb();
  const settings = (await loadSettings(db)) ?? DEFAULTS;

  return (
    <>
      <div>
        <div style={{ fontSize: 17, fontWeight: 700 }}>Tax</div>
        <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 3 }}>
          How Upshot estimates your tax position across the financial year.
        </div>
      </div>

      <TaxSettings
        financialYearStartMonth={settings.financialYearStartMonth}
        medicareLevyApplies={settings.medicareLevyApplies}
        taxableIncomeGrossCents={settings.taxableIncomeGrossCents}
        paygWithheldCents={settings.paygWithheldCents}
      />
    </>
  );
}
