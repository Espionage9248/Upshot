"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UIcon } from "@upshot/ui";
import { ROOMS } from "@/lib/rooms";

/**
 * Left navigation rail (84px). Reads the pathname itself to derive which room
 * is active; any `/settings` path highlights the gear instead and de-activates
 * every room (the two states are mutually exclusive).
 */
export function UpRail() {
  const pathname = usePathname();
  const settingsActive = pathname.startsWith("/settings");

  return (
    <nav
      data-app-rail
      aria-label="Primary"
      style={{
        width: 84,
        flexShrink: 0,
        background: "var(--bg)",
        borderRight: "1px solid var(--line-soft)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "22px 0 18px",
      }}
    >
      {/* Brand mark */}
      <div
        aria-hidden="true"
        style={{
          width: 32,
          height: 32,
          borderRadius: 11,
          background:
            "radial-gradient(120% 120% at 30% 20%, #ffb199, var(--coral) 55%, #e8553f)",
          boxShadow: "0 4px 14px rgba(255,112,92,0.34)",
          marginBottom: 26,
        }}
      />

      {/* Rooms */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          alignItems: "center",
        }}
      >
        {ROOMS.map((room) => {
          const on = !settingsActive && pathname.startsWith(room.href);
          return (
            <Link
              key={room.id}
              href={room.href}
              aria-current={on ? "page" : undefined}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                width: 64,
                textDecoration: "none",
              }}
            >
              <span
                style={{
                  width: 48,
                  height: 38,
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: on ? "var(--coral-dim)" : "transparent",
                  color: on ? "var(--coral)" : "var(--text-3)",
                }}
              >
                <UIcon name={room.id} size={21} active={on} />
              </span>
              <span
                style={{
                  fontSize: 10.5,
                  color: on ? "var(--coral)" : "var(--text-3)",
                  fontWeight: on ? 600 : 500,
                }}
              >
                {room.label}
              </span>
            </Link>
          );
        })}
      </div>

      <div style={{ flex: 1 }} />

      {/* ⌘K chip — visual affordance; the real trigger lives in TopBar */}
      <div
        aria-hidden="true"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 9px",
          borderRadius: 8,
          border: "1px solid var(--line)",
          color: "var(--text-3)",
          fontSize: 10.5,
          marginBottom: 14,
          fontFamily: "var(--font-mono)",
        }}
      >
        ⌘K
      </div>

      {/* Gear */}
      <Link
        href="/settings"
        aria-label="Settings"
        aria-current={settingsActive ? "page" : undefined}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 36,
          height: 36,
          borderRadius: 12,
          marginBottom: 14,
          background: settingsActive ? "var(--coral-dim)" : "transparent",
          color: settingsActive ? "var(--coral)" : "var(--text-3)",
        }}
      >
        <UIcon name="gear" size={20} active={settingsActive} />
      </Link>

      {/* Avatar — static initials placeholder */}
      <div
        aria-hidden="true"
        style={{
          width: 32,
          height: 32,
          borderRadius: 999,
          background: "var(--surface-2)",
          border: "1px solid var(--line)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-2)",
          fontWeight: 600,
          fontSize: 12,
        }}
      >
        SM
      </div>
    </nav>
  );
}
