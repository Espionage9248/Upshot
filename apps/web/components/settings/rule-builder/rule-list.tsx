"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { LoadedRule } from "@upshot/core";
import {
  Card,
  Button,
  ToggleRow,
  EmptyState,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  type UiSelectOption,
} from "@upshot/ui";
import { saveRuleAction, deleteRuleAction } from "@/server-actions/rules";
import { RuleEditor } from "./rule-editor";

const ACTION_LABEL: Record<string, string> = {
  RENAME: "rename",
  APPLY_TAG: "apply tag",
  SET_CATEGORY: "set category",
  MARK_SALARY: "mark salary",
  MARK_TRANSFER: "mark transfer",
  MARK_INTEREST: "mark interest",
  MARK_DEDUCTIBLE: "mark deductible",
  LINK_DEBT: "link debt",
  LINK_RECURRING: "link recurring",
  LINK_INSTALLMENT: "link BNPL",
  IGNORE_SUBSCRIPTION: "ignore subscription",
};

/** Read-only one-line summary of a rule's conditions → actions. */
function summarise(rule: LoadedRule): string {
  const conds = rule.conditions
    .map((c) => `${c.field} ${c.mode} "${c.value}"`)
    .join(" & ");
  const acts = rule.actions.map((a) => ACTION_LABEL[a.type] ?? a.type).join(", ");
  if (!conds && !acts) return "No conditions or actions yet.";
  return `IF ${conds || "(any)"} → ${acts || "(nothing)"}`;
}

/**
 * The Rules section: a list of rule cards (+ a "+ Rule" primary). Each Edit and
 * the "+ Rule" button open the RuleEditor in a Dialog. The active toggle and
 * Delete call the C3 actions then refresh. Client component — serializable
 * props only, never imports @upshot/db.
 */
export function RuleList({
  rules,
  categoryOptions,
  tagOptions,
  debtOptions,
  recurringOptions,
  installmentOptions,
}: {
  rules: LoadedRule[];
  categoryOptions: UiSelectOption[];
  tagOptions: UiSelectOption[];
  debtOptions: UiSelectOption[];
  recurringOptions: UiSelectOption[];
  installmentOptions: UiSelectOption[];
}) {
  const router = useRouter();
  // `open` is the rule being edited, or "new", or null (closed).
  const [open, setOpen] = useState<LoadedRule | "new" | null>(null);
  const [, startTransition] = useTransition();

  function close() {
    setOpen(null);
  }

  function onToggleActive(rule: LoadedRule, isActive: boolean) {
    startTransition(async () => {
      await saveRuleAction({ ...rule, rule: { ...rule.rule, isActive } });
      router.refresh();
    });
  }

  function onDelete(id: string) {
    startTransition(async () => {
      await deleteRuleAction(id);
      router.refresh();
    });
  }

  return (
    <Dialog open={open !== null} onOpenChange={(o) => (o ? undefined : close())}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <DialogTrigger asChild>
            <Button type="button" variant="primary" size="sm" onClick={() => setOpen("new")}>
              + Rule
            </Button>
          </DialogTrigger>
        </div>

        {rules.length === 0 ? (
          <EmptyState
            icon="gear"
            title="No rules yet"
            hint="Create a rule to auto-rename, tag, or categorise matching transactions."
          />
        ) : (
          rules.map((r) => (
            <Card key={r.rule.id} className="p-4">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{r.rule.name || "Untitled rule"}</div>
                  <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                    {summarise(r)}
                  </div>
                </div>
                <div style={{ width: 44, flexShrink: 0 }}>
                  <ToggleRow
                    label="Active"
                    checked={r.rule.isActive}
                    onCheckedChange={(on) => onToggleActive(r, on)}
                  />
                </div>
                <DialogTrigger asChild>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(r)}>
                    Edit
                  </Button>
                </DialogTrigger>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  aria-label={`Delete ${r.rule.name || "rule"}`}
                  onClick={() => onDelete(r.rule.id)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      <DialogContent>
        <DialogTitle>{open === "new" ? "New rule" : "Edit rule"}</DialogTitle>
        <DialogDescription>
          Define how matching transactions are renamed, tagged, or categorised.
        </DialogDescription>
        {open !== null && (
          <RuleEditor
            rule={open === "new" ? null : open}
            categoryOptions={categoryOptions}
            tagOptions={tagOptions}
            debtOptions={debtOptions}
            recurringOptions={recurringOptions}
            installmentOptions={installmentOptions}
            onClose={close}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
