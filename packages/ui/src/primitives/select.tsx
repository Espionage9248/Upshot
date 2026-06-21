"use client";

import { useId } from "react";
import { Select } from "radix-ui";
import { cn } from "../lib/cn";
import { UIcon } from "../icons";
import { controlVariants } from "./input";

export interface UiSelectOption {
  value: string;
  label: string;
}

export interface UiSelectProps {
  label?: string;
  /** Accessible name for the trigger when no visible `label` is shown. */
  "aria-label"?: string;
  hint?: string;
  error?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  options: UiSelectOption[];
}

export function UiSelect({
  label,
  "aria-label": ariaLabel,
  hint,
  error,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  disabled,
  options,
}: UiSelectProps) {
  const controlId = useId();
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const state = error ? "error" : ("default" as const);

  const triggerClass = cn(
    // controlVariants gives the base control style; flex for trigger layout
    controlVariants({ state }),
    "flex items-center justify-between gap-2 cursor-pointer",
  );

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={controlId}
          className="text-[12px] font-medium text-text-2"
        >
          {label}
        </label>
      )}
      <Select.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <Select.Trigger
          id={controlId}
          aria-label={ariaLabel}
          aria-describedby={describedBy}
          aria-invalid={error ? "true" : undefined}
          className={triggerClass}
        >
          <Select.Value placeholder={placeholder} />
          <Select.Icon asChild>
            {/* registry `chevron` points right; rotate to a downward affordance */}
            <UIcon
              name="chevron"
              size={14}
              className="text-text-2 shrink-0 rotate-90"
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
                    "text-[13.5px] text-text rounded-[var(--radius-data)]",
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
      {hint && !error && (
        <span id={hintId} className="text-[11.5px] text-text-2">
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} className="text-[11.5px] text-expense">
          {error}
        </span>
      )}
    </div>
  );
}