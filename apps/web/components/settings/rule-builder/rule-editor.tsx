"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { LoadedRule } from "@upshot/core";
import { Input, Button, type UiSelectOption } from "@upshot/ui";

// Derived from LoadedRule so this client component never imports @upshot/contracts.
type MatchCondition = LoadedRule["conditions"][number];
type MatchAction = LoadedRule["actions"][number];
import { saveRuleAction } from "@/server-actions/rules";
import { ConditionRow } from "./condition-row";
import { ActionRow } from "./action-row";
import { ApplyPreview } from "./apply-preview";

const GHOST_BTN: React.CSSProperties = {
  height: 36,
  border: "1px solid var(--line)",
  borderRadius: "var(--radius-data)",
  color: "var(--text-2)",
  fontWeight: 600,
  fontSize: 12.5,
  background: "transparent",
  padding: "0 12px",
  cursor: "pointer",
};

function blankCondition(ruleId: string): MatchCondition {
  return {
    id: crypto.randomUUID(),
    ruleId,
    field: "description",
    mode: "contains",
    value: "",
    amountCents: null,
    toleranceCents: null,
    currency: null,
  };
}

function blankAction(ruleId: string): MatchAction {
  return { id: crypto.randomUUID(), ruleId, type: "RENAME", value: "", targetId: null };
}

function initialRule(rule: LoadedRule | null): LoadedRule {
  if (rule) return rule;
  const id = crypto.randomUUID();
  return {
    rule: { id, name: "", isActive: true, priority: 100 },
    conditions: [],
    actions: [],
  };
}

/**
 * Edits a draft LoadedRule (name + condition rows + action rows) and saves via
 * the C3 saveRuleAction. Handles the THREE save outcomes: red error (!res.ok),
 * inline bad-category rejection (res.ok && !res.data.ok), success (refresh +
 * close). Embeds ApplyPreview. Client component — never imports @upshot/db.
 */
export function RuleEditor({
  rule,
  categoryOptions,
  tagOptions,
  debtOptions,
  recurringOptions,
  installmentOptions,
  onClose,
}: {
  rule: LoadedRule | null;
  categoryOptions: UiSelectOption[];
  tagOptions: UiSelectOption[];
  debtOptions: UiSelectOption[];
  recurringOptions: UiSelectOption[];
  installmentOptions: UiSelectOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<LoadedRule>(() => initialRule(rule));
  const [error, setError] = useState<string | null>(null);
  const [rejection, setRejection] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const ruleId = draft.rule.id;
  const saved = rule !== null;

  function addCondition() {
    setDraft((d) => ({ ...d, conditions: [...d.conditions, blankCondition(ruleId)] }));
  }
  function changeCondition(i: number, next: MatchCondition) {
    setDraft((d) => ({ ...d, conditions: d.conditions.map((c, idx) => (idx === i ? next : c)) }));
  }
  function removeCondition(i: number) {
    setDraft((d) => ({ ...d, conditions: d.conditions.filter((_, idx) => idx !== i) }));
  }

  function addAction() {
    setDraft((d) => ({ ...d, actions: [...d.actions, blankAction(ruleId)] }));
  }
  function changeAction(i: number, next: MatchAction) {
    setDraft((d) => ({ ...d, actions: d.actions.map((a, idx) => (idx === i ? next : a)) }));
  }
  function removeAction(i: number) {
    setDraft((d) => ({ ...d, actions: d.actions.filter((_, idx) => idx !== i) }));
  }

  function onSave() {
    setError(null);
    setRejection(null);
    startTransition(async () => {
      const res = await saveRuleAction(draft);
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      if (!res.data.ok) {
        setRejection("That category no longer exists — pick another.");
        return;
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Input
        label="Rule name"
        value={draft.rule.name}
        onChange={(e) => setDraft((d) => ({ ...d, rule: { ...d.rule, name: e.target.value } }))}
        placeholder="e.g. Coffee shops"
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {draft.conditions.map((c, i) => (
          <ConditionRow
            key={c.id}
            condition={c}
            onChange={(next) => changeCondition(i, next)}
            onRemove={() => removeCondition(i)}
          />
        ))}
        <button type="button" style={GHOST_BTN} onClick={addCondition}>
          + Add condition
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {draft.actions.map((a, i) => (
          <ActionRow
            key={a.id}
            action={a}
            categoryOptions={categoryOptions}
            tagOptions={tagOptions}
            debtOptions={debtOptions}
            recurringOptions={recurringOptions}
            installmentOptions={installmentOptions}
            onChange={(next) => changeAction(i, next)}
            onRemove={() => removeAction(i)}
          />
        ))}
        <button type="button" style={GHOST_BTN} onClick={addAction}>
          + Add action
        </button>
      </div>

      {rejection && (
        <p role="alert" style={{ fontSize: 11.5, color: "var(--warn)", margin: 0 }}>
          {rejection}
        </p>
      )}
      {error && (
        <p role="alert" style={{ fontSize: 11.5, color: "var(--expense)", margin: 0 }}>
          {error}
        </p>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button type="button" variant="primary" size="sm" onClick={onSave} disabled={pending}>
          Save
        </Button>
      </div>

      <ApplyPreview draft={draft} saved={saved} />
    </div>
  );
}
