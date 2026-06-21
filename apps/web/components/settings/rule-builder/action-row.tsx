"use client";

import type { LoadedRule } from "@upshot/core";
import { Input, UiSelect, Button, UIcon, type UiSelectOption } from "@upshot/ui";

// Derived from LoadedRule so this client component never imports @upshot/contracts.
type MatchAction = LoadedRule["actions"][number];

/**
 * Action types offered in the builder. Now includes LINK_DEBT / LINK_RECURRING /
 * LINK_INSTALLMENT / IGNORE_SUBSCRIPTION — all wired and honoured by the engine.
 */
const ACTION_OPTIONS = [
  { value: "RENAME", label: "Rename to" },
  { value: "APPLY_TAG", label: "Apply tag" },
  { value: "SET_CATEGORY", label: "Set category" },
  { value: "MARK_SALARY", label: "Mark as salary" },
  { value: "MARK_TRANSFER", label: "Mark as transfer" },
  { value: "MARK_INTEREST", label: "Mark as interest" },
  { value: "MARK_DEDUCTIBLE", label: "Mark tax-deductible" },
  { value: "LINK_DEBT", label: "Link to debt" },
  { value: "LINK_RECURRING", label: "Link to recurring" },
  { value: "LINK_INSTALLMENT", label: "Link to BNPL plan" },
  { value: "IGNORE_SUBSCRIPTION", label: "Ignore (not a subscription)" },
];

/**
 * One action row: `→ [action] [dependent field]`, styled as the coral action
 * chip (--coral-dim / --coral-text). SET_CATEGORY / APPLY_TAG write the chosen
 * id to targetId; RENAME writes free text to value; MARK_* and
 * IGNORE_SUBSCRIPTION have no extra field; LINK_* show an entity target picker.
 * Serializable props only.
 */
export function ActionRow({
  action,
  categoryOptions,
  tagOptions,
  debtOptions,
  recurringOptions,
  installmentOptions,
  onChange,
  onRemove,
}: {
  action: MatchAction;
  categoryOptions: UiSelectOption[];
  tagOptions: UiSelectOption[];
  debtOptions: UiSelectOption[];
  recurringOptions: UiSelectOption[];
  installmentOptions: UiSelectOption[];
  onChange: (next: MatchAction) => void;
  onRemove: () => void;
}) {
  return (
    <div
      data-testid="action-row"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
        padding: "8px 10px",
        borderRadius: "var(--radius-data)",
        background: "var(--coral-dim)",
        color: "var(--coral-text)",
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 700 }}>→</span>
      <div style={{ minWidth: 160 }}>
        <UiSelect
          aria-label="Action type"
          options={ACTION_OPTIONS}
          value={action.type}
          onValueChange={(v) =>
            // Reset the dependent payload when switching action type.
            onChange({ ...action, type: v as MatchAction["type"], value: null, targetId: null })
          }
        />
      </div>

      {action.type === "RENAME" && (
        <div style={{ flex: 1, minWidth: 120 }}>
          <Input
            aria-label="Rename value"
            value={action.value ?? ""}
            onChange={(e) => onChange({ ...action, value: e.target.value })}
            placeholder="New name"
          />
        </div>
      )}

      {action.type === "SET_CATEGORY" && (
        <div style={{ minWidth: 170 }}>
          <UiSelect
            aria-label="Target category"
            options={categoryOptions}
            value={action.targetId ?? undefined}
            placeholder="Choose category"
            onValueChange={(v) => onChange({ ...action, targetId: v })}
          />
        </div>
      )}

      {action.type === "APPLY_TAG" && (
        <div style={{ minWidth: 170 }}>
          <UiSelect
            aria-label="Target tag"
            options={tagOptions}
            value={action.targetId ?? undefined}
            placeholder="Choose tag"
            onValueChange={(v) => onChange({ ...action, targetId: v })}
          />
        </div>
      )}

      {action.type === "LINK_DEBT" && (
        <div style={{ minWidth: 170 }}>
          <UiSelect
            label="Target debt"
            options={debtOptions}
            value={action.targetId ?? undefined}
            placeholder="Choose debt"
            onValueChange={(v) => onChange({ ...action, targetId: v })}
          />
        </div>
      )}

      {action.type === "LINK_RECURRING" && (
        <div style={{ minWidth: 170 }}>
          <UiSelect
            label="Target recurring item"
            options={recurringOptions}
            value={action.targetId ?? undefined}
            placeholder="Choose recurring item"
            onValueChange={(v) => onChange({ ...action, targetId: v })}
          />
        </div>
      )}

      {action.type === "LINK_INSTALLMENT" && (
        <div style={{ minWidth: 170 }}>
          <UiSelect
            label="Target BNPL plan"
            options={installmentOptions}
            value={action.targetId ?? undefined}
            placeholder="Choose plan"
            onValueChange={(v) => onChange({ ...action, targetId: v })}
          />
        </div>
      )}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label="Remove action"
        onClick={onRemove}
      >
        <UIcon name="x" size={14} />
      </Button>
    </div>
  );
}
