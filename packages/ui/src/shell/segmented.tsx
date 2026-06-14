import { ToggleGroup } from "radix-ui";
import { cn } from "../lib/cn";

export interface SegmentedOption {
  value: string;
  label: string;
}

export interface SegmentedProps {
  options: SegmentedOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  "aria-label"?: string;
  className?: string;
}

export function Segmented({
  options,
  value,
  defaultValue,
  onValueChange,
  "aria-label": ariaLabel,
  className,
}: SegmentedProps) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center",
        "bg-[var(--surface-2)] border border-[var(--line)]",
        "rounded-[var(--radius-pill)] p-[3px] gap-[2px]",
        className,
      )}
    >
      {options.map((opt) => (
        <ToggleGroup.Item
          key={opt.value}
          value={opt.value}
          className={cn(
            "text-[12.5px] font-semibold px-[14px] py-[6px]",
            "rounded-[var(--radius-pill)] cursor-pointer outline-none",
            // round3.jsx: active = solid coral fill + on-coral text; inactive = text-3
            "text-[var(--text-3)]",
            "data-[state=on]:bg-[var(--coral)] data-[state=on]:text-[var(--on-coral)]",
            "focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-1",
          )}
        >
          {opt.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
