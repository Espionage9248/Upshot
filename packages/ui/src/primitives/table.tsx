import type { HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from "react";
import { cn } from "../lib/cn";

// Table family: composable semantic wrappers over <table>/<thead>/<tbody>/<tr>/<th>/<td>.
// Selected row: bg-[var(--coral-dim)] + inset 2px 0 0 var(--coral) left edge.
// Numeric cells: text-right + tnum (tabular figures via JetBrains Mono class).

export function Table({ className, children, ...rest }: HTMLAttributes<HTMLTableElement>) {
  return (
    <table {...rest} className={cn("w-full border-collapse", className)}>
      {children}
    </table>
  );
}

export function THead({ className, children, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead {...rest} className={cn("bg-[var(--surface-2)]", className)}>
      {children}
    </thead>
  );
}

export function TBody({ className, children, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody {...rest} className={cn(className)}>
      {children}
    </tbody>
  );
}

export interface TRProps extends HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean;
}

export function TR({ selected, className, style, children, ...rest }: TRProps) {
  return (
    <tr
      {...rest}
      className={cn(
        "border-b border-[var(--line-soft)]",
        // selected keeps its coral-dim fill (don't let hover override it)
        selected
          ? "bg-[var(--coral-dim)] shadow-[inset_2px_0_0_var(--coral)]"
          : "hover:bg-[var(--surface-2)]",
        className,
      )}
      style={style}
    >
      {children}
    </tr>
  );
}

export interface THProps extends ThHTMLAttributes<HTMLTableCellElement> {
  numeric?: boolean;
}

export function TH({ numeric, className, children, ...rest }: THProps) {
  return (
    <th
      {...rest}
      className={cn(
        "px-3 py-2",
        "text-[length:var(--text-label)] font-bold uppercase tracking-[0.09em] text-[var(--text-3)]",
        "text-left",
        numeric && "text-right tnum",
        className,
      )}
    >
      {children}
    </th>
  );
}

export interface TDProps extends TdHTMLAttributes<HTMLTableCellElement> {
  numeric?: boolean;
}

export function TD({ numeric, className, children, ...rest }: TDProps) {
  return (
    <td
      {...rest}
      className={cn(
        "px-3 py-2 text-[var(--text)]",
        numeric && "text-right tnum",
        className,
      )}
    >
      {children}
    </td>
  );
}
