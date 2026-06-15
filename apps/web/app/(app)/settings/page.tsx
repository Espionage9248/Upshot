import type { ReactNode } from "react";
import { Card } from "@upshot/ui";
import { getDb } from "@/lib/db";
import { loadSettings } from "@/server-actions/settings-core";
import { ConnectionsForm } from "@/components/settings/connections-form";
import { ReconnectButton } from "@/components/reconnect-button";

// Reads the encrypted DB at request time (getDb → createDbClientFromEnv throws
// without DB_ENCRYPTION_KEY), so this route must never be statically prerendered.
export const dynamic = "force-dynamic";

/** Defaults for a fresh, unseeded DB (no app_settings row yet). */
const DEFAULTS = {
  id: "default",
  syncCadence: "DAILY",
  wifiOnlySync: false,
  backgroundRefresh: true,
  notifyOnSyncFail: true,
  autoDetectRecurring: true,
  autoCategorise: true,
  nightlyBackup: true,
  debtStrategy: "SNOWBALL",
  extraPaymentCents: 0,
  bigPurchaseThresholdCents: 0,
  currency: "AUD",
  dateFormat: "DD/MM/YYYY",
  financialYearStartMonth: 7,
  medicareLevyApplies: true,
  updatedAt: new Date(0).toISOString(),
} as const;

export default async function ConnectionsSyncPage(): Promise<ReactNode> {
  const { db } = getDb();
  const settings = (await loadSettings(db)) ?? DEFAULTS;

  return (
    <>
      <div>
        <div style={{ fontSize: 17, fontWeight: 700 }}>Connections &amp; sync</div>
        <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 3 }}>
          How Upshot pulls your data, how often, and the health of each connection.
        </div>
      </div>

      {/* Up bank connection */}
      <Card className="p-0">
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px" }}>
          <div
            aria-hidden="true"
            style={{
              width: 40,
              height: 40,
              borderRadius: 11,
              flexShrink: 0,
              background:
                "radial-gradient(120% 120% at 30% 20%, #ffb199, var(--coral) 55%, #e8553f)",
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Up</span>
              <StatusPill kind="healthy" />
            </div>
            {/* PAT semantics: no renewal date — a token is valid until revoked;
                a 401/403 surfaces the Reconnect state instead. */}
            <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>
              Open Banking · last synced 4m ago · token valid
            </div>
          </div>
          <ReconnectButton />
        </div>
      </Card>

      <ConnectionsForm settings={settings} />
    </>
  );
}

/** Connection status pill (mirrors round3.jsx StatusPill). */
function StatusPill({ kind }: { kind: "healthy" | "reconnect" }) {
  const [label, color] =
    kind === "reconnect" ? ["Reconnect", "var(--warn)"] : ["Healthy", "var(--income)"];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        fontSize: 12,
        fontWeight: 600,
        color,
        padding: "5px 11px",
        borderRadius: 999,
        background: `color-mix(in oklch, ${color} 12%, transparent)`,
        border: `1px solid color-mix(in oklch, ${color} 26%, transparent)`,
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: 999, background: color }} />
      {label}
    </span>
  );
}
