"use client";

import type { ReactElement, ReactNode, CSSProperties } from "react";
import { UIcon, type UIconKey } from "@upshot/ui";

const MONO = "var(--font-mono)";

/** "yyyy-MM" + n months → "yyyy-MM". */
export function addMonths(ym: string, n: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}
/** "yyyy-MM" → "Mon 'YY" (en-AU). */
export function labelMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1, 1));
  return d.toLocaleString("en-AU", { month: "short", timeZone: "UTC" }) + " '" + String(y).slice(2);
}
/** whole-month difference a→b ("yyyy-MM"). */
export function diffMonths(a: string, b: string): number {
  const [ay, am] = a.split("-").map(Number);
  const [by, bm] = b.split("-").map(Number);
  return (by - ay) * 12 + (bm - am);
}

/** Dollar string → integer cents (Global Constraint: never parseFloat). */
function parseCents(raw: string): number {
  const t = raw.trim().replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return 0;
  return Math.round(Number(t) * 100);
}
/** Integer cents → grouped dollar string (no currency symbol; mono input body). */
function centsToDollars(cents: number): string {
  return Math.round(cents / 100).toLocaleString("en-AU");
}

export function PlannerLabel({ children, style }: { children: ReactNode; style?: CSSProperties }): ReactElement {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.09em",
        textTransform: "uppercase",
        color: "var(--text-3)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function SeedHint({ children }: { children: ReactNode }): ReactElement {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontStyle: "italic", color: "var(--text-3)" }}>
      <UIcon name="flag" size={11} /> {children}
    </span>
  );
}

export function MoneyInput({
  valueCents,
  onCents,
  suffix,
  width,
  size = "md",
  "aria-label": ariaLabel,
  disabled,
}: {
  valueCents: number;
  onCents: (cents: number) => void;
  suffix?: string;
  width?: number;
  size?: "sm" | "md";
  "aria-label": string;
  disabled?: boolean;
}): ReactElement {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <input
        aria-label={ariaLabel}
        inputMode="decimal"
        disabled={disabled}
        value={centsToDollars(valueCents)}
        onChange={(e) => onCents(parseCents(e.target.value))}
        style={{
          width: width ?? 120,
          textAlign: "right",
          fontFamily: MONO,
          fontSize: size === "sm" ? 12.5 : 13.5,
          fontWeight: 700,
          padding: size === "sm" ? "5px 8px" : "7px 9px",
          borderRadius: "var(--radius-data)",
          border: "1px solid var(--line)",
          background: "var(--surface-2)",
          color: "var(--text)",
          opacity: disabled ? 0.5 : 1,
        }}
        className="tnum"
        readOnly={false}
      />
      {suffix && <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{suffix}</span>}
    </span>
  );
}

export function Disclosure({
  n,
  icon,
  title,
  summary,
  open,
  onToggle,
  children,
}: {
  n?: number;
  icon?: UIconKey;
  title: string;
  summary?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}): ReactElement {
  return (
    <div
      style={{
        borderRadius: "var(--radius-data)",
        border: "1px solid var(--line)",
        background: open ? "var(--surface)" : "var(--surface-2)",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 11,
          padding: "12px 14px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        {n != null && (
          <span
            className="tnum"
            style={{
              width: 22,
              height: 22,
              borderRadius: 7,
              flexShrink: 0,
              background: open ? "var(--coral)" : "var(--surface-3)",
              color: open ? "var(--on-coral)" : "var(--text-3)",
              fontSize: 12,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: MONO,
            }}
          >
            {n}
          </span>
        )}
        {icon && n == null && (
          <span style={{ color: open ? "var(--coral-text)" : "var(--text-3)", flexShrink: 0, display: "flex" }}>
            <UIcon name={icon} size={17} />
          </span>
        )}
        <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>{title}</span>
        {!open && summary && (
          <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 600, whiteSpace: "nowrap" }}>{summary}</span>
        )}
        <span
          style={{
            color: "var(--text-3)",
            display: "flex",
            transform: open ? "rotate(90deg)" : "none",
            transition: "transform var(--duration-base)",
          }}
        >
          <UIcon name="chevron" size={16} />
        </span>
      </button>
      {open && <div style={{ padding: "4px 14px 16px" }}>{children}</div>}
    </div>
  );
}
