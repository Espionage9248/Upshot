import { Slider } from "radix-ui";
import { cn } from "../lib/cn";

export interface UiSliderProps {
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  "aria-label"?: string;
  className?: string;
}

export function UiSlider({
  value,
  defaultValue,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled,
  "aria-label": ariaLabel,
  className,
}: UiSliderProps) {
  // Determine thumb count from value or defaultValue for rendering multiple thumbs
  const thumbCount = (value ?? defaultValue ?? [0]).length;

  return (
    <Slider.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        "h-5", // touch target height
        "disabled:opacity-[0.42] disabled:pointer-events-none",
        className,
      )}
    >
      <Slider.Track
        className={cn(
          "relative h-[5px] w-full grow overflow-hidden rounded-full",
          "bg-[var(--surface-3)]",
        )}
      >
        <Slider.Range className="absolute h-full rounded-full bg-[var(--coral)]" />
      </Slider.Track>
      {Array.from({ length: thumbCount }).map((_, i) => (
        <Slider.Thumb
          key={i}
          className={cn(
            // 16px thumb
            "block h-4 w-4 rounded-full",
            // design hardcodes #fff (white in both modes), matching the switch thumb
            "bg-white border-2 border-[var(--coral)]",
            "shadow-[var(--elev-1)]",
            "focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-2",
            "cursor-pointer",
          )}
          aria-label={thumbCount > 1 ? `${ariaLabel ?? "Value"} ${i + 1}` : ariaLabel}
        />
      ))}
    </Slider.Root>
  );
}
