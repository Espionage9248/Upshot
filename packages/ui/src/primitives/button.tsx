import { type VariantProps, cva } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";
import { UIcon, type UIconKey } from "../icons";

const buttonVariants = cva(
  // base
  [
    "inline-flex items-center justify-center gap-[7px]",
    "font-semibold font-sans whitespace-nowrap",
    "rounded-[var(--radius-data)] border border-transparent",
    "cursor-pointer transition-all duration-[var(--duration-fast)]",
    "hover:brightness-[1.08] active:translate-y-px",
    "disabled:opacity-[0.42] disabled:pointer-events-none",
  ],
  {
    variants: {
      variant: {
        primary: "bg-coral text-[var(--on-coral)]",
        secondary: "bg-surface-2 text-text border-line",
        ghost: "bg-transparent text-text-2",
        danger: [
          "bg-[color-mix(in_oklch,var(--expense)_14%,transparent)]",
          "text-expense",
          "border-[color-mix(in_oklch,var(--expense)_30%,transparent)]",
        ],
      },
      size: {
        sm: "h-8 px-3 text-[12.5px]",
        md: "h-[38px] px-4 text-[13.5px]",
        lg: "h-11 px-5 text-[14.5px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariants {
  loading?: boolean;
  leadingIcon?: UIconKey;
  trailingIcon?: UIconKey;
}

export function Button({
  variant,
  size,
  loading = false,
  leadingIcon,
  trailingIcon,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const iconSize = size === "sm" ? 14 : size === "lg" ? 16 : 15;

  const leading = loading ? (
    <UIcon name="sync" size={iconSize} className="animate-spin motion-reduce:animate-none" />
  ) : leadingIcon ? (
    <UIcon name={leadingIcon} size={iconSize} />
  ) : null;

  const trailing = trailingIcon ? (
    <UIcon name={trailingIcon} size={iconSize} />
  ) : null;

  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading ? true : undefined}
      className={cn(buttonVariants({ variant, size }), className)}
    >
      {leading}
      {children}
      {trailing}
    </button>
  );
}
