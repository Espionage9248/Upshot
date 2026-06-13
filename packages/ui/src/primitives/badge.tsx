import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

// Maps badge tone to the CSS variable used for fill/border and the text var.
// Tones with @theme aliases can use the var directly; all others use var(--x).
const TONE_VARS: Record<
  BadgeTone,
  { color: string; text: string }
> = {
  neutral: { color: "var(--text-2)", text: "var(--text-2)" },
  income:  { color: "var(--income)",  text: "var(--income)" },
  expense: { color: "var(--expense)", text: "var(--expense)" },
  transfer:{ color: "var(--transfer)",text: "var(--transfer)" },
  saved:   { color: "var(--saved)",   text: "var(--saved)" },
  debt:    { color: "var(--debt)",    text: "var(--debt)" },
  warn:    { color: "var(--warn)",    text: "var(--warn)" },
  coral:   { color: "var(--coral)",   text: "var(--coral-text)" },
};

export type BadgeTone = "neutral" | "income" | "expense" | "transfer" | "saved" | "debt" | "warn" | "coral";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone: BadgeTone;
}

export function Badge({ tone, className, style, children, ...rest }: BadgeProps) {
  const { color, text } = TONE_VARS[tone];

  return (
    <span
      {...rest}
      className={cn(
        "inline-flex items-center px-[10px] py-[3px]",
        "rounded-[var(--radius-data)] border",
        "text-[11px] font-bold leading-none",
        className,
      )}
      style={{
        background: `color-mix(in oklch, ${color} 13%, transparent)`,
        borderColor: `color-mix(in oklch, ${color} 26%, transparent)`,
        color: text,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
