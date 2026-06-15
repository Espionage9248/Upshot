"use client";

/**
 * Tooltip — Radix Tooltip wrapped with Upshot design tokens.
 *
 * Exports:
 *   - `Tooltip` — convenience component: wraps Provider > Root > Trigger(asChild) + Content
 *   - Raw Radix parts re-exported for advanced composition: TooltipProvider,
 *     TooltipRoot, TooltipTrigger, TooltipContent
 *
 * delayDuration default 150ms (spec) — pass 0 in tests to skip the delay.
 *
 * Animation: CSS transition on Radix data-[state] (no tailwindcss-animate).
 * No arrow by default (spec doesn't call for one in the surface bubble).
 */
import type { ReactNode } from "react";
import { Tooltip } from "radix-ui";
import { cn } from "../lib/cn";

// ── Raw Radix parts ─────────────────────────────────────────────────────────

export function TooltipProvider({
  ...props
}: React.ComponentPropsWithoutRef<typeof Tooltip.Provider>) {
  return <Tooltip.Provider {...props} />;
}

export function TooltipRoot({
  ...props
}: React.ComponentPropsWithoutRef<typeof Tooltip.Root>) {
  return <Tooltip.Root {...props} />;
}

export function TooltipTrigger({
  ...props
}: React.ComponentPropsWithoutRef<typeof Tooltip.Trigger>) {
  return <Tooltip.Trigger {...props} />;
}

export function TooltipContent({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Tooltip.Content>) {
  return (
    <Tooltip.Portal>
      <Tooltip.Content
        className={cn(
          // surface bubble — spec §2 tooltip uses --surface-3 (a raised neutral)
          "z-50 px-2.5 py-1.5",
          "bg-[var(--surface-3)] border border-[var(--line)]",
          "rounded-[var(--radius-data)] shadow-[var(--elev-pop)]",
          // typography: 12px text
          "text-[12px] text-[var(--text)] leading-[1.3]",
          // fade transition
          "transition-opacity duration-[var(--duration-base)] ease-[var(--ease-out)]",
          "data-[state=instant-open]:opacity-100",
          "data-[state=delayed-open]:opacity-100",
          "data-[state=closed]:opacity-0",
          "outline-none",
          className,
        )}
        {...props}
      />
    </Tooltip.Portal>
  );
}

// ── Convenience wrapper ──────────────────────────────────────────────────────

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  delayDuration?: number;
  side?: React.ComponentPropsWithoutRef<typeof Tooltip.Content>["side"];
}

export function UiTooltip({
  content,
  children,
  delayDuration = 150,
  side,
}: TooltipProps) {
  return (
    <Tooltip.Provider>
      <Tooltip.Root delayDuration={delayDuration}>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        <TooltipContent side={side}>{content}</TooltipContent>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

// Main named export — `Tooltip` as the convenience wrapper
export { UiTooltip as Tooltip };