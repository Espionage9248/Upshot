import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { UIcon, type UIconKey } from "../icons";

export interface EmptyStateProps {
  icon?: UIconKey;
  title: string;
  hint?: string;
  action?: ReactNode;
  suggested?: boolean;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  hint,
  action,
  suggested = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn("border-dashed flex flex-col items-center text-center", className)}
      style={{
        padding: "14px 16px",
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: suggested
          ? "color-mix(in oklch, var(--coral) 30%, transparent)"
          : "var(--line)",
        borderRadius: "var(--radius-data)",
        background: suggested
          ? "color-mix(in oklch, var(--coral) 6%, transparent)"
          : "transparent",
      }}
    >
      {icon && (
        <div
          style={{
            color: "var(--text-3)",
            marginBottom: 6,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <UIcon name={icon} size={22} />
        </div>
      )}
      <div
        style={{
          fontSize: 12.5,
          color: "var(--text-2)",
          fontWeight: 600,
        }}
      >
        {title}
      </div>
      {hint && (
        <div
          style={{
            fontSize: 11,
            color: "var(--text-3)",
            marginTop: 2,
          }}
        >
          {hint}
        </div>
      )}
      {action && <div style={{ marginTop: 10 }}>{action}</div>}
    </div>
  );
}
