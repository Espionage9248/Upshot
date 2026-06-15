import { cn } from "../lib/cn";

// Skeleton shimmer: Tailwind built-in animate-pulse on --surface-2 base.
// Chosen over custom @keyframes injection because:
//   1. Self-contained — no document access needed, SSR-safe.
//   2. animate-pulse is a recognised pattern; motion-reduce:animate-none is
//      one Tailwind class away (no extra CSS).
//   3. The ds.jsx reference uses background-size shimmer as a nicety;
//      an opacity pulse on surface-2 is an accepted, common approximation.

export interface SkeletonProps {
  className?: string;
  [key: string]: unknown;
}

export function Skeleton({ className, ...rest }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "bg-[var(--surface-2)] rounded",
        // Shimmer: pulse opacity; paused under reduced-motion
        "animate-pulse motion-reduce:animate-none",
        className,
      )}
      {...rest}
    />
  );
}
