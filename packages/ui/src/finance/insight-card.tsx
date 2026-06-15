import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { UIcon, type UIconKey } from "../icons";

export interface InsightCardProps {
  icon?: UIconKey;
  children: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export function InsightCard({ icon, children, onDismiss, className }: InsightCardProps) {
  return (
    <div
      className={cn("flex gap-[10px] items-start", className)}
      style={{
        padding: "11px 13px",
        background: "var(--surface-2)",
        borderRadius: "var(--radius-data)",
        border: "1px solid var(--line-soft)",
      }}
    >
      {icon && (
        <span style={{ color: "var(--text-3)", flexShrink: 0 }}>
          <UIcon name={icon} size={15} />
        </span>
      )}
      <span
        style={{
          flex: 1,
          fontSize: 12,
          color: "var(--text-2)",
          lineHeight: 1.4,
        }}
      >
        {children}
      </span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          style={{
            flexShrink: 0,
            color: "var(--text-3)",
            lineHeight: 1,
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
          aria-label="Dismiss"
        >
          <UIcon name="x" size={13} />
        </button>
      )}
    </div>
  );
}
