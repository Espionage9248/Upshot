"use client";

import { Switch } from "radix-ui";
import { cn } from "../lib/cn";

export interface UiSwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  className?: string;
}

export function UiSwitch({
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  id,
  "aria-label": ariaLabel,
  className,
}: UiSwitchProps) {
  return (
    <Switch.Root
      id={id}
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        // 38×22 track
        "relative inline-flex h-[22px] w-[38px] shrink-0",
        "cursor-pointer rounded-full border-2 border-transparent",
        "bg-[var(--surface-3)]",
        "data-[state=checked]:bg-[var(--coral)]",
        "transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)]",
        "focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-2",
        "disabled:opacity-[0.42] disabled:pointer-events-none",
        className,
      )}
    >
      <Switch.Thumb
        className={cn(
          // 18px white thumb; 2px inset on each side so it fits in 22px track
          "block h-[18px] w-[18px] rounded-full bg-white",
          "shadow-sm",
          "translate-x-0 data-[state=checked]:translate-x-[16px]",
          "transition-transform duration-[var(--duration-fast)] ease-[var(--ease-out)]",
        )}
      />
    </Switch.Root>
  );
}