"use client";

import { useId, type InputHTMLAttributes, type Ref } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

export const controlVariants = cva(
  [
    "w-full px-3",
    "bg-[var(--surface-2)] border border-[var(--line)]",
    "rounded-[var(--radius-data)]",
    "text-[13.5px] text-text placeholder:text-text-2",
    "outline-none transition-all duration-[var(--duration-fast)]",
    "disabled:opacity-50 disabled:pointer-events-none",
    // spec: focus = --focus border + 3px --coral/22% halo. Declarative so it
    // composes with the global :focus-visible system instead of replacing it.
    "focus-visible:border-[var(--focus)]",
    "focus-visible:shadow-[0_0_0_3px_color-mix(in_oklch,var(--coral)_22%,transparent)]",
  ],
  {
    variants: {
      state: {
        default: "",
        error: "border-[var(--expense)]",
      },
      size: {
        single: "h-[38px]",
        multi: "min-h-[80px] py-2",
      },
    },
    defaultVariants: {
      state: "default",
      size: "single",
    },
  },
);

type ControlVariants = VariantProps<typeof controlVariants>;

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  mono?: boolean;
  ref?: Ref<HTMLInputElement>;
}

export function Input({
  label,
  hint,
  error,
  mono,
  id,
  className,
  disabled,
  ref,
  ...rest
}: InputProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const state: ControlVariants["state"] = error ? "error" : "default";

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
      <input
        {...rest}
        id={controlId}
        ref={ref}
        disabled={disabled}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy}
        className={cn(
          controlVariants({ state }),
          mono && "font-mono text-right tnum",
          className,
        )}
      />
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