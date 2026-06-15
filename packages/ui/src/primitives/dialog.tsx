"use client";

/**
 * Dialog — Radix Dialog wrapped with Upshot design tokens.
 *
 * Animation approach: CSS transition using Radix data-[state] attributes.
 * tailwindcss-animate is NOT a dependency — pure Tailwind + CSS transition.
 * Open:  data-[state=open]:opacity-100  data-[state=open]:scale-100
 * Close: data-[state=closed]:opacity-0  data-[state=closed]:scale-[0.96]
 * (Radix removes the element after the close transition completes when
 * the parent Dialog.Root manages mounted state — no forceMount needed.)
 *
 * Scrim: a literal warm-black at 55% + 2px blur. NOT a neutral token — the
 * neutral scale inverts between modes (--n-900 is --text, near-white in dark),
 * so a token-based scrim would become a white veil in dark mode. The spec calls
 * for a mode-independent "warm black", same exception as the white switch thumb.
 */
import { Dialog } from "radix-ui";
import { cn } from "../lib/cn";
import { UIcon } from "../icons";

// Overlay (scrim) — shared with Sheet
export function DialogOverlay({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Dialog.Overlay>) {
  return (
    <Dialog.Overlay
      className={cn(
        "fixed inset-0 z-40",
        // warm-black scrim at 55% + 2px backdrop blur (mode-independent literal)
        "bg-[oklch(0.18_0.015_60_/_0.55)] backdrop-blur-[2px]",
        // open/close transition
        "transition-opacity duration-[var(--duration-slow)] ease-[var(--ease-out)]",
        "data-[state=open]:opacity-100 data-[state=closed]:opacity-0",
        className,
      )}
      {...props}
    />
  );
}

// Root passthrough
export function Dialog_Root({
  ...props
}: React.ComponentPropsWithoutRef<typeof Dialog.Root>) {
  return <Dialog.Root {...props} />;
}

// Trigger passthrough
export function DialogTrigger({
  ...props
}: React.ComponentPropsWithoutRef<typeof Dialog.Trigger>) {
  return <Dialog.Trigger {...props} />;
}

// Centred content with overlay + animation
export function DialogContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof Dialog.Content>) {
  return (
    <Dialog.Portal>
      <DialogOverlay />
      <Dialog.Content
        className={cn(
          // positioning: centred
          "fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
          // sizing
          "w-[min(480px,calc(100vw-2rem))]",
          // surface
          "bg-[var(--surface)] rounded-[var(--radius-card)] shadow-[var(--elev-3)]",
          // padding
          "p-6",
          // open/close animation: scale + fade
          "transition-[opacity,transform] duration-[var(--duration-slow)] ease-[var(--ease-out)]",
          "data-[state=open]:opacity-100 data-[state=open]:scale-100",
          "data-[state=closed]:opacity-0 data-[state=closed]:scale-[0.96]",
          // focus outline
          "outline-none",
          className,
        )}
        {...props}
      >
        {/* built-in close button top-right */}
        <Dialog.Close
          className={cn(
            "absolute top-3 right-3",
            "inline-flex items-center justify-center",
            "w-7 h-7 rounded-[var(--radius-sm)]",
            "text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]",
            "transition-colors duration-[var(--duration-fast)]",
            "outline-none focus-visible:outline-2 focus-visible:outline-[var(--focus)]",
          )}
          aria-label="Close"
        >
          <UIcon name="x" size={16} />
        </Dialog.Close>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  );
}

// Title passthrough
export function DialogTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Dialog.Title>) {
  return (
    <Dialog.Title
      className={cn("text-[14px] font-[700] mb-1", className)}
      {...props}
    />
  );
}

// Description passthrough
export function DialogDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Dialog.Description>) {
  return (
    <Dialog.Description
      className={cn("text-[12px] text-[var(--text-2)] leading-[1.45] mb-4", className)}
      {...props}
    />
  );
}

// Close passthrough (for callers to compose their own close trigger)
export function DialogClose({
  ...props
}: React.ComponentPropsWithoutRef<typeof Dialog.Close>) {
  return <Dialog.Close {...props} />;
}

// Main export — Dialog.Root aliased for tree-shaking clarity
export { Dialog_Root as Dialog };