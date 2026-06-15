"use client";

import { Select } from "radix-ui";
import { cn } from "../lib/cn";
import { UIcon } from "../icons";

export interface FilterChipOption {
  value: string;
  label: string;
}

export interface FilterChipProps {
  label: string;
  options: FilterChipOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function FilterChip({
  label,
  options,
  value,
  onValueChange,
  className,
}: FilterChipProps) {
  const isActive = !!value;

  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger
        className={cn(
          "inline-flex items-center gap-[7px] h-[34px] px-[12px]",
          "rounded-[var(--radius-data)] border cursor-pointer outline-none",
          "text-[12.5px] font-semibold whitespace-nowrap",
          isActive
            ? [
                "border-[color-mix(in_oklch,var(--coral)_34%,transparent)]",
                "bg-[var(--coral-dim)] text-[var(--coral-text)]",
              ]
            : [
                "border-[var(--line)] bg-transparent text-[var(--text-2)]",
              ],
          "focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-1",
          className,
        )}
      >
        <span
          className={cn(
            isActive ? "text-[var(--coral-text)]" : "text-[var(--text-3)]",
          )}
        >
          {label}
        </span>
        <Select.Value />
        <Select.Icon asChild>
          <UIcon
            name="chevron"
            size={13}
            className="rotate-90 opacity-70 shrink-0"
          />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          className={cn(
            "z-50 overflow-hidden",
            "bg-[var(--surface)] border border-[var(--line)]",
            "rounded-[var(--radius-card)]",
            "shadow-[var(--elev-pop)]",
          )}
        >
          <Select.Viewport className="p-1">
            {options.map((opt) => (
              <Select.Item
                key={opt.value}
                value={opt.value}
                className={cn(
                  "relative flex items-center gap-2 px-3 py-2 pr-8",
                  "text-[13.5px] text-[var(--text)] rounded-[var(--radius-data)]",
                  "cursor-pointer outline-none",
                  "data-[highlighted]:bg-[var(--surface-2)]",
                  "data-[disabled]:opacity-50 data-[disabled]:pointer-events-none",
                )}
              >
                <Select.ItemText>{opt.label}</Select.ItemText>
                <Select.ItemIndicator className="absolute right-2">
                  <UIcon name="check" size={13} />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}