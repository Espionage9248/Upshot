import type { ReactElement } from "react";
import { UIcon, type UIconKey } from "../icons";

export type MoneyKind = "income" | "expense" | "transfer" | "saved" | "debt" | "projected" | "neutral";

const MAP: Record<MoneyKind, { color: string; sign: string; arrow: UIconKey | null }> = {
  income:    { color: "var(--income)",   sign: "+", arrow: "up" },
  expense:   { color: "var(--expense)",  sign: "−", arrow: "down" },
  transfer:  { color: "var(--transfer)", sign: "",  arrow: "swap" },
  saved:     { color: "var(--saved)",    sign: "+", arrow: "up" },
  debt:      { color: "var(--debt)",     sign: "−", arrow: "down" },
  projected: { color: "var(--proj)",     sign: "~", arrow: null },
  neutral:   { color: "var(--text)",     sign: "",  arrow: null },
};

function formatCents(cents: number, currency: string, showCents: boolean): string {
  const abs = Math.abs(cents) / 100;
  return abs.toLocaleString("en-AU", {
    style: "currency",
    currency,
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  });
}

export function Money({
  cents,
  kind = "expense",
  currency = "AUD",
  size = 15,
  weight = 600,
  showCents = true,
  arrow = false,
  quiet = false,
}: {
  cents: number;
  kind?: MoneyKind;
  currency?: string;
  size?: number;
  weight?: number;
  showCents?: boolean;
  arrow?: boolean;
  quiet?: boolean;
}): ReactElement {
  const m = MAP[kind];
  // `neutral` carries no fixed sign, but a negative neutral value still shows
  // `−` for direction (matches ds.jsx reference). transfer stays sign-less.
  const sign = kind === "neutral" && cents < 0 ? "−" : m.sign;
  const body = formatCents(cents, currency, showCents);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        color: quiet ? "var(--text)" : m.color,
        whiteSpace: "nowrap",
        borderBottom: kind === "projected" ? "1px dashed var(--proj)" : "none",
        paddingBottom: kind === "projected" ? 1 : 0,
      }}
    >
      {arrow && m.arrow && <UIcon name={m.arrow} size={size * 0.8} />}
      <span
        className="tnum"
        style={{
          fontFamily: "var(--font-mono)",
          fontWeight: weight,
          fontSize: size,
          letterSpacing: "-0.02em",
        }}
      >
        <span style={{ opacity: 0.85 }}>{sign}</span>
        {body}
      </span>
    </span>
  );
}
