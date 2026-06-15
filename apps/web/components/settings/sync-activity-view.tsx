"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  SyncStatus,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  UIcon,
} from "@upshot/ui";
import {
  UiTabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@upshot/ui";
import { syncHealthToState } from "@/lib/sync-state";
import { syncNowAction } from "@/server-actions/sync";
import type {
  SyncActivityData,
  RunRow,
  RunState,
} from "@/app/(app)/settings/sync-activity/data";

/** Derived state → Badge tone + label (mirrors round3.jsx RunBadge). */
const STATE_BADGE: Record<RunState, { tone: "income" | "neutral" | "expense" | "warn"; label: string }> = {
  success: { tone: "income", label: "Success" },
  running: { tone: "neutral", label: "Running" },
  failed: { tone: "expense", label: "Failed" },
  token: { tone: "warn", label: "Token expired" },
};

export function SyncActivityView({ data }: { data: SyncActivityData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSyncNow() {
    startTransition(async () => {
      const res = await syncNowAction();
      if (res.ok) router.refresh();
    });
  }

  return (
    <>
      {/* Header: title + health pill + last sync, with Sync now on the right. */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>Sync &amp; activity</div>
          <div
            style={{
              fontSize: 12.5,
              color: "var(--text-3)",
              marginTop: 3,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <SyncStatus state={syncHealthToState(data.health)} />
            {data.lastSyncAt ? `Last sync ${data.runs[0]?.when ?? formatLastSync(data.lastSyncAt)}` : "No sync yet"}
          </div>
        </div>
        <Button variant="primary" leadingIcon="sync" loading={pending} onClick={onSyncNow}>
          Sync now
        </Button>
      </div>

      <UiTabs defaultValue="runs">
        <TabsList>
          <TabsTrigger value="runs">Runs</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="runs" style={{ marginTop: 16 }}>
          <RunsTable runs={data.runs} />
        </TabsContent>

        <TabsContent value="activity" style={{ marginTop: 16 }}>
          <ActivityList activity={data.activity} />
        </TabsContent>
      </UiTabs>
    </>
  );
}

function RunsTable({ runs }: { runs: RunRow[] }) {
  if (runs.length === 0) {
    return (
      <Card>
        <div style={{ fontSize: 13, color: "var(--text-3)", padding: "8px 2px" }}>No runs yet</div>
      </Card>
    );
  }
  return (
    <Card className="p-0">
      <Table>
        <THead>
          <TR>
            <TH>Job</TH>
            <TH>Status</TH>
            <TH>Result</TH>
            <TH numeric>Duration</TH>
            <TH numeric>When</TH>
          </TR>
        </THead>
        <TBody>
          {runs.map((r) => {
            const badge = STATE_BADGE[r.state];
            return (
              <TR key={r.id}>
                <TD>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                    <span style={{ color: "var(--text-3)" }}>
                      <UIcon name={r.icon} size={16} />
                    </span>
                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>{r.jobLabel}</span>
                  </span>
                </TD>
                <TD>
                  <Badge tone={badge.tone}>{badge.label}</Badge>
                </TD>
                <TD>
                  <span
                    style={{
                      fontSize: 12.5,
                      color: r.state === "token" ? "var(--warn)" : "var(--text-2)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {r.result}
                    {r.reconnect && (
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--coral-text)" }}>
                        Reconnect
                      </span>
                    )}
                  </span>
                </TD>
                <TD numeric>
                  <span style={{ fontSize: 12.5, fontFamily: "var(--font-mono)", color: "var(--text-3)" }}>
                    {r.duration}
                  </span>
                </TD>
                <TD numeric>
                  <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text-3)" }}>
                    {r.when}
                  </span>
                </TD>
              </TR>
            );
          })}
        </TBody>
      </Table>
    </Card>
  );
}

function ActivityList({ activity }: { activity: SyncActivityData["activity"] }) {
  if (activity.length === 0) {
    return (
      <Card>
        <div style={{ fontSize: 13, color: "var(--text-3)", padding: "8px 2px" }}>No activity yet</div>
      </Card>
    );
  }
  return (
    <Card>
      {activity.map((a, i) => (
        <div
          key={a.id}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 13,
            padding: "14px 0",
            borderBottom: i === activity.length - 1 ? "none" : "1px solid var(--line-soft)",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: "color-mix(in oklch, var(--text-3) 13%, transparent)",
              color: "var(--text-3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <UIcon name={a.icon} size={16} />
          </div>
          <div style={{ flex: 1, fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.45 }}>
            {a.description}
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: "var(--text-3)",
              fontFamily: "var(--font-mono)",
              whiteSpace: "nowrap",
              marginTop: 2,
            }}
          >
            {a.when}
          </div>
        </div>
      ))}
    </Card>
  );
}

/** Fallback relative label if no run row supplies a precomputed `when`. */
function formatLastSync(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
