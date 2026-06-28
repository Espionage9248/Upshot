"use client";

import { useTransition, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReactElement } from "react";
import type { Owner } from "@upshot/core";
import { updateTwoUpAttributionAction } from "@/server-actions/two-up";

const OWNER_OPTIONS: { label: string; value: Owner }[] = [
  { label: "James", value: "JAMES" },
  { label: "Britt", value: "BRITTNEY" },
  { label: "Unassigned", value: "UNASSIGNED" },
  { label: "Shared", value: "SHARED" },
];

function ownerLabel(owner: Owner): string {
  return OWNER_OPTIONS.find((o) => o.value === owner)?.label ?? owner;
}

export function MarkOwnerControl({
  id,
  owner,
  category,
  onSaved,
}: {
  id: string;
  owner: Owner;
  category: string | null;
  onSaved?: () => void;
}): ReactElement {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  function choose(next: Owner) {
    setOpen(false);
    startTransition(async () => {
      await updateTwoUpAttributionAction({ id, owner: next });
      router.refresh();
      onSaved?.();
    });
  }

  return (
    <div ref={menuRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        aria-label={`Set owner — ${ownerLabel(owner)}`}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={pending}
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          height: 28,
          padding: "0 10px",
          borderRadius: "var(--radius-data)",
          border: "1px solid var(--line)",
          background: "transparent",
          color: "var(--text-2)",
          fontSize: 12,
          fontWeight: 600,
          cursor: pending ? "not-allowed" : "pointer",
          opacity: pending ? 0.6 : 1,
          whiteSpace: "nowrap",
        }}
      >
        {ownerLabel(owner)}
        <span
          style={{
            fontSize: 10,
            color: "var(--text-3)",
            transform: open ? "rotate(180deg)" : "none",
            display: "inline-block",
            transition: "transform 0.15s",
          }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 50,
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-card)",
            boxShadow: "var(--elev-pop)",
            minWidth: 140,
            padding: 4,
          }}
        >
          {OWNER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              role="menuitem"
              type="button"
              onClick={() => choose(opt.value)}
              style={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                padding: "8px 12px",
                border: "none",
                background: owner === opt.value ? "var(--surface-2)" : "transparent",
                color: "var(--text)",
                fontSize: 13.5,
                fontWeight: owner === opt.value ? 600 : 400,
                cursor: "pointer",
                borderRadius: "var(--radius-data)",
                textAlign: "left",
              }}
            >
              {opt.label}
              {opt.label === "James" && (
                <span
                  style={{
                    marginLeft: 6,
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: "var(--viz-2)",
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
              )}
              {opt.label === "Britt" && (
                <span
                  style={{
                    marginLeft: 6,
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: "var(--viz-4)",
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
              )}
            </button>
          ))}
          {category !== null && (
            <div
              style={{
                borderTop: "1px solid var(--line-soft)",
                marginTop: 4,
                paddingTop: 4,
              }}
            >
              <div
                style={{
                  padding: "6px 12px",
                  fontSize: 11,
                  color: "var(--text-3)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Category
              </div>
              <div
                style={{
                  padding: "4px 12px 8px",
                  fontSize: 13,
                  color: "var(--text-2)",
                }}
              >
                {category}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
