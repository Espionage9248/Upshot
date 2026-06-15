"use client";

import { SyncStatus, UIcon } from "@upshot/ui";
import type { SyncHealth } from "@upshot/core";
import { syncHealthToState } from "@/lib/sync-state";

interface TopBarProps {
  title: string;
  sub?: string;
  /** Real sync health; when omitted the pill shows a neutral "up to date". */
  health?: SyncHealth;
}

/**
 * Page chrome header: page title/sub on the left, a command-palette trigger,
 * a sync-status pill and a notifications bell on the right. Rendered per-page so
 * each page supplies its own title/sub.
 */
export function TopBar({ title, sub, health }: TopBarProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
      }}
    >
      <div>
        {sub && (
          <div
            style={{
              fontSize: 12.5,
              color: "var(--text-3)",
              fontWeight: 600,
              letterSpacing: "0.04em",
              marginBottom: 4,
            }}
          >
            {sub}
          </div>
        )}
        <h1
          style={{
            fontSize: 27,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          {title}
        </h1>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Search / ⌘K trigger */}
        <button
          type="button"
          aria-label="Open command palette"
          data-command-trigger
          onClick={() =>
            window.dispatchEvent(new Event("upshot:open-command-palette"))
          }
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            height: 38,
            padding: "0 14px",
            borderRadius: 999,
            border: "1px solid var(--line)",
            background: "transparent",
            color: "var(--text-3)",
            fontSize: 13,
            whiteSpace: "nowrap",
            cursor: "pointer",
          }}
        >
          <UIcon name="search" size={15} /> Search{" "}
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, opacity: 0.7 }}>
            ⌘K
          </span>
        </button>

        {/* Sync-status pill */}
        <SyncStatus state={health ? syncHealthToState(health) : "healthy"} />

        {/* Notifications */}
        <button
          type="button"
          aria-label="Notifications"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 38,
            height: 38,
            borderRadius: 999,
            border: "1px solid var(--line)",
            background: "transparent",
            color: "var(--text-2)",
            cursor: "pointer",
          }}
        >
          <UIcon name="bell" size={17} />
        </button>
      </div>
    </div>
  );
}
