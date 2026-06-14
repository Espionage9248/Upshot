import { cn } from "../lib/cn";

export type SyncState = "healthy" | "syncing" | "failed" | "token";

const STATE_MAP: Record<
  SyncState,
  { color: string; defaultLabel: string }
> = {
  healthy: { color: "var(--income)",  defaultLabel: "Up to date" },
  syncing: { color: "var(--text-3)",  defaultLabel: "Syncing…" },
  failed:  { color: "var(--expense)", defaultLabel: "Sync failed" },
  token:   { color: "var(--warn)",    defaultLabel: "Reconnect bank" },
};

export interface SyncStatusProps {
  state: SyncState;
  label?: string;
  className?: string;
}

export function SyncStatus({ state, label, className }: SyncStatusProps) {
  const { color, defaultLabel } = STATE_MAP[state];
  const text = label ?? defaultLabel;

  return (
    <div
      className={cn("inline-flex items-center gap-2 w-fit", className)}
      style={{
        fontSize: 12.5,
        fontWeight: 600,
        color,
        padding: "5px 11px",
        borderRadius: 999,
        background: `color-mix(in oklch, ${color} 12%, transparent)`,
        border: `1px solid color-mix(in oklch, ${color} 24%, transparent)`,
      }}
    >
      <span
        data-dot=""
        className={cn(
          "block rounded-full flex-shrink-0",
          state === "syncing" && "animate-pulse motion-reduce:animate-none",
        )}
        style={{
          width: 7,
          height: 7,
          background: color,
        }}
      />
      {text}
    </div>
  );
}
