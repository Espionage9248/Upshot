"use client";

import { useState, useTransition } from "react";
import { Card, Segmented, ToggleRow, UIcon } from "@upshot/ui";
import { setCadenceAction, setAutomationFlagAction } from "@/server-actions/settings";
import type { AppSettings, SyncCadence, AutomationFlag } from "@/server-actions/settings";

const CADENCE_OPTIONS: { value: SyncCadence; label: string }[] = [
  { value: "REALTIME", label: "Real-time" },
  { value: "HOURLY", label: "Hourly" },
  { value: "DAILY", label: "Daily" },
];

/**
 * Client controls for Connections & sync. Receives the persisted settings from
 * the Server Component and wires Segmented / ToggleRows to the Server Actions.
 * Optimistic local state so toggles feel instant; on a failed ActionResult the
 * control reverts to its previous value.
 */
export function ConnectionsForm({ settings }: { settings: AppSettings }) {
  const [cadence, setCadenceState] = useState<SyncCadence>(settings.syncCadence);
  const [flags, setFlags] = useState({
    wifiOnlySync: settings.wifiOnlySync,
    notifyOnSyncFail: settings.notifyOnSyncFail,
    backgroundRefresh: settings.backgroundRefresh,
    autoDetectRecurring: settings.autoDetectRecurring,
    autoCategorise: settings.autoCategorise,
    nightlyBackup: settings.nightlyBackup,
  });
  const [, startTransition] = useTransition();

  function onCadence(next: string) {
    if (next === "" || next === cadence) return; // radix emits "" on deselect
    const prev = cadence;
    const value = next as SyncCadence;
    setCadenceState(value);
    startTransition(async () => {
      const res = await setCadenceAction(value);
      if (!res.ok) setCadenceState(prev);
    });
  }

  function onFlag(key: AutomationFlag, on: boolean) {
    const prev = flags[key];
    setFlags((f) => ({ ...f, [key]: on }));
    startTransition(async () => {
      const res = await setAutomationFlagAction(key, on);
      if (!res.ok) setFlags((f) => ({ ...f, [key]: prev }));
    });
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16,
        flex: 1,
        minHeight: 0,
      }}
    >
      <Card className="p-4">
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.09em",
            color: "var(--text-3)",
            marginBottom: 12,
          }}
        >
          Sync cadence
        </div>
        <Segmented
          aria-label="Sync cadence"
          options={CADENCE_OPTIONS}
          value={cadence}
          onValueChange={onCadence}
        />
        <div style={{ marginTop: 8 }}>
          <ToggleRow
            label="Only sync on Wi-Fi"
            sub="Pause syncing on mobile data"
            checked={flags.wifiOnlySync}
            onCheckedChange={(on) => onFlag("wifiOnlySync", on)}
          />
          <ToggleRow
            label="Notify me if a sync fails"
            sub="Including expired bank connections"
            checked={flags.notifyOnSyncFail}
            onCheckedChange={(on) => onFlag("notifyOnSyncFail", on)}
          />
          <ToggleRow
            label="Background refresh"
            sub="Sync while the app is closed"
            checked={flags.backgroundRefresh}
            onCheckedChange={(on) => onFlag("backgroundRefresh", on)}
          />
        </div>
      </Card>

      <Card className="p-4">
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.09em",
            color: "var(--text-3)",
            marginBottom: 12,
          }}
        >
          Detection & automation
        </div>
        <ToggleRow
          label="Auto-detect recurring & fees"
          sub="Find subscriptions and bank fees"
          checked={flags.autoDetectRecurring}
          onCheckedChange={(on) => onFlag("autoDetectRecurring", on)}
        />
        <ToggleRow
          label="Auto-categorise with rules"
          sub="Apply your match rules on import"
          checked={flags.autoCategorise}
          onCheckedChange={(on) => onFlag("autoCategorise", on)}
        />
        <ToggleRow
          label="Nightly encrypted backup"
          sub="Local, AES-256 — never leaves device"
          checked={flags.nightlyBackup}
          onCheckedChange={(on) => onFlag("nightlyBackup", on)}
        />
        <div
          style={{
            marginTop: 14,
            paddingTop: 14,
            borderTop: "1px solid var(--line-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 12, color: "var(--text-3)" }}>
            Full activity &amp; job history
          </span>
          <a
            href="/settings/sync-activity"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12.5,
              fontWeight: 600,
              color: "var(--coral-text)",
              textDecoration: "none",
            }}
          >
            Sync &amp; activity <UIcon name="arrowR" size={13} />
          </a>
        </div>
      </Card>
    </div>
  );
}
