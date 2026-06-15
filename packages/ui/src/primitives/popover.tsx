"use client";

/**
 * Popover — Radix Popover wrapped with Upshot design tokens.
 *
 * Animation: CSS transition using data-[state] attributes (no tailwindcss-animate).
 * Open:  data-[state=open]:opacity-100   data-[state=open]:translate-y-0
 * Close: data-[state=closed]:opacity-0   data-[state=closed]:translate-y-[4px]
 * (4px rise on open, per spec)
 *
 * sideOffset default 6px — keeps content visually separated from its trigger.
 */
import { Popover } from "radix-ui";
import { cn } from "../lib/cn";

// Root passthrough
export function Popover_Root({
  ...props
}: React.ComponentPropsWithoutRef<typeof Popover.Root>) {
  return <Popover.Root {...props} />;
}

// Trigger passthrough
export function PopoverTrigger({
  ...props
}: React.ComponentPropsWithoutRef<typeof Popover.Trigger>) {
  return <Popover.Trigger {...props} />;
}

// Styled content via portal
export function PopoverContent({
  className,
  sideOffset = 6,
  ...props
}: React.ComponentPropsWithoutRef<typeof Popover.Content>) {
  return (
    <Popover.Portal>
      <Popover.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50",
          // surface
          "bg-[var(--surface)] border border-[var(--line)]",
          "rounded-[var(--radius-card)] shadow-[var(--elev-pop)]",
          // padding
          "p-3",
          // open/close animation: fade + 4px rise
          "transition-[opacity,transform] duration-[var(--duration-base)] ease-[var(--ease-out)]",
          "data-[state=open]:opacity-100 data-[state=open]:translate-y-0",
          "data-[state=closed]:opacity-0 data-[state=closed]:translate-y-[4px]",
          // focus
          "outline-none",
          className,
        )}
        {...props}
      />
    </Popover.Portal>
  );
}

// Close passthrough
export function PopoverClose({
  ...props
}: React.ComponentPropsWithoutRef<typeof Popover.Close>) {
  return <Popover.Close {...props} />;
}

// Main export
export { Popover_Root as Popover };