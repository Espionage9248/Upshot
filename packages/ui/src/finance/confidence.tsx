import { cn } from "../lib/cn";
import { UIcon } from "../icons";

export type ConfidenceLevel = "on" | "at" | "off";

interface SegmentDef {
  id: ConfidenceLevel;
  label: string;
  glyph: string;
  color: string;
}

const SEGMENTS: SegmentDef[] = [
  { id: "off", label: "Off track", glyph: "↓", color: "var(--expense)" },
  { id: "at",  label: "At risk",   glyph: "•", color: "var(--warn)" },
  { id: "on",  label: "On track",  glyph: "✓", color: "var(--income)" },
];

export interface ConfidenceProps {
  level?: ConfidenceLevel;
  compact?: boolean;
  className?: string;
}

export function Confidence({ level = "on", compact = false, className }: ConfidenceProps) {
  const active = SEGMENTS.find((s) => s.id === level) ?? (SEGMENTS[2] as SegmentDef);

  if (compact) {
    return (
      <span
        className={cn("inline-flex items-center gap-1.5", className)}
        style={{
          fontSize: 11.5,
          fontWeight: 700,
          color: active.color,
          whiteSpace: "nowrap",
        }}
      >
        {level === "on" ? (
          <UIcon name="check" size={13} />
        ) : level === "at" ? (
          <UIcon name="alert" size={13} />
        ) : (
          <UIcon name="down" size={13} />
        )}
        {active.label}
      </span>
    );
  }

  return (
    <div className={cn("flex gap-[5px]", className)}>
      {SEGMENTS.map(({ id, label, glyph, color }) => {
        const isActive = id === level;
        return (
          <div
            key={id}
            data-segment=""
            data-active={isActive ? "true" : "false"}
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 10,
              fontWeight: 700,
              padding: "6px 0",
              borderRadius: "var(--radius-data)",
              whiteSpace: "nowrap",
              background: isActive
                ? `color-mix(in oklch, ${color} 16%, transparent)`
                : "transparent",
              color: isActive ? color : "var(--text-3)",
              border: isActive
                ? `1px solid color-mix(in oklch, ${color} 32%, transparent)`
                : "1px solid var(--line)",
            }}
          >
            {isActive ? `${glyph} ${label}` : label}
          </div>
        );
      })}
    </div>
  );
}
