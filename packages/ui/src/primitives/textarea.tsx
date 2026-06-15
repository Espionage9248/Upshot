"use client";

import { useId, type TextareaHTMLAttributes, type Ref } from "react";
import { cn } from "../lib/cn";
import { controlVariants } from "./input";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  ref?: Ref<HTMLTextAreaElement>;
}

export function Textarea({
  label,
  hint,
  error,
  id,
  className,
  disabled,
  ref,
  ...rest
}: TextareaProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const state = error ? "error" : ("default" as const);

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
      <textarea
        {...rest}
        id={controlId}
        ref={ref}
        disabled={disabled}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy}
        className={cn(controlVariants({ state, size: "multi" }), className)}
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