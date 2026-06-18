"use client";

import type { LoadedRule } from "@upshot/core";
import { Input, UiSelect, Button, UIcon } from "@upshot/ui";

// Derived from LoadedRule so this client component never imports @upshot/contracts.
type MatchCondition = LoadedRule["conditions"][number];

const FIELD_OPTIONS = [
  { value: "description", label: "Description" },
  { value: "categoryName", label: "Category name" },
  { value: "rawText", label: "Raw text" },
];

const MODE_OPTIONS = [
  { value: "contains", label: "contains" },
  { value: "startsWith", label: "starts with" },
  { value: "exact", label: "is exactly" },
  { value: "regex", label: "matches regex" },
];

/**
 * One condition row: `IF [field] [operator] [value]`. Field/operator are
 * token-styled chips (--surface-2 / --line); value is a free-text Input. Amount
 * / tolerance / currency are omitted for v1 (kept null on the assembled
 * condition). Serializable props only — no @upshot/db.
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
    </div>
  );
}
