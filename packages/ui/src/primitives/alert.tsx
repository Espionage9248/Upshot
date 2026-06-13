import type { HTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";
import { UIcon, type UIconKey } from "../icons";

// Maps tone to the CSS variable used for the fill/border color-mix.
// "info" (neutral) uses --text-2 (secondary text color) for a muted neutral tint —
// there is no --info or --neutral token; --text-2 is the closest neutral in the palette.
const TONE_VARS: Record<AlertTone, string> = {
  info:     "var(--text-2)",
  warning:  "var(--warn)",
  critical: "var(--expense)",
};

// Default icon per tone (all keys confirmed in registry.ts)
const TONE_ICONS: Record<AlertTone, UIconKey> = {
  info:     "bell",   // closest to notification/info; no circle-info in registry
  warning:  "alert",  // AlertTriangle — perfect for warning
  critical: "alert",  // AlertTriangle — most alarming available
};

export type AlertTone = "info" | "warning" | "critical";

const alertVariants = cva(
  "flex gap-[11px] items-start px-[14px] py-[12px] rounded-[var(--radius-data)] border text-[12.5px] leading-[1.4]",
  {
    variants: {
      tone: {
        info:     "",
        warning:  "",
        critical: "",
      },
    },
    defaultVariants: { tone: "info" },
  },
);

export interface AlertProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "role">,
    VariantProps<typeof alertVariants> {
  icon?: UIconKey | false;
  action?: ReactNode;
  children: ReactNode;
}

export function Alert({
  tone = "info",
  icon,
  action,
  className,
  style,
  children,
  ...rest
}: AlertProps) {
  const colorVar = TONE_VARS[tone ?? "info"];
  const resolvedTone = tone ?? "info";

  // warning + critical get role="alert"; info does not
  const role = resolvedTone === "info" ? undefined : "alert";

  // Resolve icon: undefined → use default; false → hide; UIconKey → use that
  const iconKey: UIconKey | false =
    icon === false ? false : icon ?? TONE_ICONS[resolvedTone];

  return (
    <div
      {...rest}
      role={role}
      className={cn(alertVariants({ tone }), className)}
      style={{
        background: `color-mix(in oklch, ${colorVar} 12%, transparent)`,
        borderColor: `color-mix(in oklch, ${colorVar} 28%, transparent)`,
        ...style,
      }}
    >
      {iconKey !== false && (
        <span style={{ color: colorVar, flexShrink: 0, marginTop: 1 }}>
          <UIcon name={iconKey} size={16} />
        </span>
      )}
      <span className="flex-1 text-[var(--text)]">{children}</span>
      {action && <span className="flex-shrink-0">{action}</span>}
    </div>
  );
}
