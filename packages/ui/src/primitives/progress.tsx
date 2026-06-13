import { Progress } from "radix-ui";
import { cn } from "../lib/cn";

export interface UiProgressProps {
  value?: number;
  max?: number;
  "aria-label"?: string;
  className?: string;
}

export function UiProgress({
  value,
  max = 100,
  "aria-label": ariaLabel,
  className,
}: UiProgressProps) {
  const isIndeterminate = value === undefined || value === null;
  const pct = isIndeterminate ? 0 : Math.min(100, Math.max(0, (value / max) * 100));

  return (
    // Progress.Root renders role="progressbar" with aria-valuenow/aria-valuemax
    <Progress.Root
      value={isIndeterminate ? null : value}
      max={max}
      aria-label={ariaLabel}
      className={cn(
        // 6px tall track, surface-3 bg, rounded-full, overflow-hidden (spec)
        "relative h-[6px] w-full rounded-full bg-[var(--surface-3)] overflow-hidden",
        className,
      )}
    >
      <Progress.Indicator
        data-testid="progress-indicator"
        className={cn(
          "h-full rounded-full",
          // Coral gradient per ds.jsx: linear-gradient(90deg, color-mix(in oklch, var(--coral) 80%, #fff), var(--coral))
          "bg-[linear-gradient(90deg,color-mix(in_oklch,var(--coral)_80%,#fff),var(--coral))]",
          isIndeterminate
            ? // Indeterminate: full-width gradient bar pulsing (built-in, no
              // runtime keyframe injection); paused under reduced motion.
              "w-full animate-pulse motion-reduce:animate-none"
            : // Determinate: Radix idiom — fill via translateX
              "w-full transition-transform duration-[var(--duration-base)] ease-[var(--ease-out)]",
        )}
        style={
          isIndeterminate
            ? undefined
            : { transform: `translateX(-${100 - pct}%)` }
        }
      />
    </Progress.Root>
  );
}
