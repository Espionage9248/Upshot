import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

// --text-label is a font-size token: 0.6875rem (11px) with line-height 1.2.
// The eyebrow style is: text-[length:var(--text-label)] font-bold uppercase tracking-[0.09em]
// (matching ds.jsx typography spec: 11 / 1.2 · 700 · 0.09em caps)

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={cn(
        "bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius-card)] shadow-[var(--elev-1)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={cn("flex items-center justify-between px-4 pt-4 pb-3", className)}
    >
      {children}
    </div>
  );
}

// CardTitle is the --text-label eyebrow: 11px / 700 / 0.09em caps / uppercase
export function CardTitle({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={cn(
        "text-[length:var(--text-label)] font-bold uppercase tracking-[0.09em] text-[var(--text-3)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardBody({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest} className={cn("px-4 pb-4", className)}>
      {children}
    </div>
  );
}
