/**
 * Sheet — edge-anchored overlay built on Radix Dialog.
 *
 * Side "bottom" (phone default): slides up from the bottom edge.
 * Side "right" (desktop): slides in from the right edge.
 *
 * Reuses the same scrim overlay as Dialog (DialogOverlay).
 * Animation: CSS transition on transform + opacity via Radix data-[state] attrs.
 * No tailwindcss-animate dependency.
 */
import { Dialog } from "radix-ui";
import { cn } from "../lib/cn";
import { DialogOverlay } from "./dialog";

export type SheetSide = "bottom" | "right";

// Root passthrough
export function Sheet({
  ...props
}: React.ComponentPropsWithoutRef<typeof Dialog.Root>) {
  return <Dialog.Root {...props} />;
}

// Trigger passthrough
export function SheetTrigger({
  ...props
}: React.ComponentPropsWithoutRef<typeof Dialog.Trigger>) {
  return <Dialog.Trigger {...props} />;
}

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof Dialog.Content> {
  side?: SheetSide;
}

// Edge-anchored content
export function SheetContent({
  side = "bottom",
  className,
  children,
  ...props
}: SheetContentProps) {
  const isBottom = side === "bottom";

  return (
    <Dialog.Portal>
      <DialogOverlay />
      <Dialog.Content
        className={cn(
          "fixed z-50",
          "bg-[var(--surface)] shadow-[var(--elev-3)]",
          "outline-none",
          // side-specific positioning + size
          isBottom
            ? [
                // bottom sheet
                "inset-x-0 bottom-0",
                "rounded-t-[var(--radius-card)]",
                "max-h-[90dvh] overflow-y-auto",
                // slide-in animation from bottom
                "transition-[opacity,transform] duration-[var(--duration-slow)] ease-[var(--ease-out)]",
                "data-[state=open]:opacity-100 data-[state=open]:translate-y-0",
                "data-[state=closed]:opacity-0 data-[state=closed]:translate-y-4",
              ]
            : [
                // right sheet
                "inset-y-0 right-0 h-full w-[min(420px,100%)]",
                // slide-in animation from right
                "transition-[opacity,transform] duration-[var(--duration-slow)] ease-[var(--ease-out)]",
                "data-[state=open]:opacity-100 data-[state=open]:translate-x-0",
                "data-[state=closed]:opacity-0 data-[state=closed]:translate-x-4",
              ],
          className,
        )}
        {...props}
      >
        {/* drag handle — bottom sheets only */}
        {isBottom && (
          <div
            aria-hidden="true"
            className="mx-auto mt-3 mb-4 w-9 h-1 rounded-[999px] bg-[var(--surface-3)]"
          />
        )}
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  );
}

// Title passthrough
export function SheetTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Dialog.Title>) {
  return (
    <Dialog.Title
      className={cn("text-[13px] font-[700] mb-2", className)}
      {...props}
    />
  );
}

// Close passthrough
export function SheetClose({
  ...props
}: React.ComponentPropsWithoutRef<typeof Dialog.Close>) {
  return <Dialog.Close {...props} />;
}
