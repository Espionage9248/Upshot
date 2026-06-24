"use client";

import type { LoadedRule } from "@upshot/core";
import { Input, UiSelect, Button, UIcon } from "@upshot/ui";

// Derived from LoadedRule so this client component never imports @upshot/contracts.
type MatchCondition = LoadedRule["conditions"][number];

const FIELD_OPTIONS = [
  { value: "description", label: "Description" },
  { value: "categoryName", label: "Category name" },
  { value: "rawText", label: "Raw text" },
  { value: "note", label: "Note" },
];

const MODE_OPTIONS = [
  { value: "contains", label: "contains" },
  { value: "startsWith", label: "starts with" },
  { value: "exact", label: "is exactly" },
  { value: "regex", label: "matches regex" },
];

/** Parse a dollar string to integer cents; null when blank or invalid. */
function dollarsToCents(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  return Math.round(Number(trimmed) * 100);
}

/**
 * One condition row: `IF [field] [operator] [value]` with an optional second
 * line for `≈ $[amount] ± $[tolerance] [currency]`. Field/operator are
 * token-styled chips (--surface-2 / --line); value is a free-text Input. Amount
 * / tolerance / currency are optional — null means no amount check. Serializable
 * props only — no @upshot/db.
 */
export function ConditionRow({
  condition,
  onChange,
  onRemove,
}: {
  condition: MatchCondition;
  onChange: (next: MatchCondition) => void;
  onRemove: () => void;
}) {
  return (
    <div
      data-testid="condition-row"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
        padding: "8px 10px",
        borderRadius: "var(--radius-data)",
        background: "var(--surface-2)",
        border: "1px solid var(--line)",
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)" }}>IF</span>
      <div style={{ minWidth: 150 }}>
        <UiSelect
          aria-label="Condition field"
          options={FIELD_OPTIONS}
          value={condition.field}
          onValueChange={(v) =>
            onChange({ ...condition, field: v as MatchCondition["field"] })
          }
        />
      </div>
      <div style={{ minWidth: 130 }}>
        <UiSelect
          aria-label="Condition operator"
          options={MODE_OPTIONS}
          value={condition.mode}
          onValueChange={(v) =>
            onChange({ ...condition, mode: v as MatchCondition["mode"] })
          }
        />
      </div>
      <div style={{ flex: 1, minWidth: 120 }}>
        <Input
          aria-label="Condition value"
          value={condition.value}
          onChange={(e) => onChange({ ...condition, value: e.target.value })}
          placeholder="e.g. coffee"
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label="Remove condition"
        onClick={onRemove}
      >
        <UIcon name="x" size={14} />
      </Button>

      {/* Optional amount constraint — same flex container, wraps to a second line */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexBasis: "100%",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 11, color: "var(--text-3)" }}>≈ $</span>
        <div style={{ width: 80 }}>
          <Input
            aria-label="Condition amount"
            value={condition.amountCents != null ? (condition.amountCents / 100).toFixed(2) : ""}
            onChange={(e) =>
              onChange({ ...condition, amountCents: dollarsToCents(e.target.value) })
            }
            placeholder="8.00"
          />
        </div>
        <span style={{ fontSize: 11, color: "var(--text-3)" }}>±$</span>
        <div style={{ width: 80 }}>
          <Input
            aria-label="Condition tolerance"
            value={condition.toleranceCents != null ? (condition.toleranceCents / 100).toFixed(2) : ""}
            onChange={(e) =>
              onChange({ ...condition, toleranceCents: dollarsToCents(e.target.value) })
            }
            placeholder="0.50"
          />
        </div>
        <div style={{ width: 70 }}>
          <Input
            aria-label="Condition currency"
            value={condition.currency ?? ""}
            onChange={(e) =>
              onChange({
                ...condition,
                currency: e.target.value.toUpperCase() || null,
              })
            }
            placeholder="USD"
          />
        </div>
      </div>
    </div>
  );
}
