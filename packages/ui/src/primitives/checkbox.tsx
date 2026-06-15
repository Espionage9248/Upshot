"use client";

import { Checkbox } from "radix-ui";
import { cn } from "../lib/cn";
import { UIcon } from "../icons";

export interface UiCheckboxProps {
  checked?: boolean | "indeterminate";
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean | "indeterminate") => void;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  className?: string;
}

export function UiCheckbox({
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  id,
  "aria-label": ariaLabel,
  className,
}: UiCheckboxProps) {
  return (
    <Checkbox.Root
      id={id}
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        // 18px box, crisp radius (design uses ~5px → --radius-sm); `group` lets
        // the indicator children react to Radix's data-state without prop sniffing
        "group inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center",
        "rounded-[var(--radius-sm)]",
        "border-[1.5px] border-[var(--line)] bg-transparent",
        "data-[state=checked]:bg-[var(--coral)] data-[state=checked]:border-[var(--coral)]",
        // indeterminate stays unfilled so the coral bar reads as coral (spec)
        "data-[state=indeterminate]:border-[var(--coral)]",
        "cursor-pointer",
        "focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-2",
        "disabled:opacity-[0.42] disabled:pointer-events-none",
        className,
      )}
    >
      <Checkbox.Indicator className="flex items-center justify-center text-[var(--on-coral)]">
        {/* Indicator only mounts when checked/indeterminate; pick the glyph from
            the Root's data-state (robust for controlled AND uncontrolled use). */}
        <UIcon
          name="check"
          size={12}
          className="hidden group-data-[state=checked]:block"
        />
        <span className="hidden h-[2px] w-[10px] rounded-full bg-[var(--coral)] group-data-[state=indeterminate]:block" />
      </Checkbox.Indicator>
    </Checkbox.Root>
  );
}