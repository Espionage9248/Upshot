"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription,
  type UiSelectOption,
} from "@upshot/ui";
import type { LoadedRule } from "@upshot/core";
import { RuleEditor } from "@/components/settings/rule-builder/rule-editor";
import { dismissSuggestionAction } from "@/server-actions/recurring";

/** Build the seed rule: name + one description condition + a LINK_DEBT action targeting the debt. */
function seedRule(args: {
  debtId: string;
  debtName: string;
  seedDescription: string;
  seedAmountCents?: number;
}): LoadedRule {
  const ruleId = crypto.randomUUID();
  return {
    rule: { id: ruleId, name: `Debt payments: ${args.debtName}`, isActive: true, priority: 50 },
    conditions: [{
      id: crypto.randomUUID(), ruleId, field: "description", mode: "contains",
      value: args.seedDescription,
      amountCents: args.seedAmountCents ?? null,
      toleranceCents: null, currency: null,
    }],
    actions: [{ id: crypto.randomUUID(), ruleId, type: "LINK_DEBT", value: null, targetId: args.debtId }],
  };
}

export function DebtRuleLinkDialog({
  debtId, debtName, seedDescription, seedAmountCents, suggestionId,
  categoryOptions, tagOptions, debtOptions, recurringOptions, installmentOptions,
  trigger,
}: {
  debtId: string;
  debtName: string;
  seedDescription: string;
  seedAmountCents?: number;
  suggestionId?: string;
  categoryOptions: UiSelectOption[];
  tagOptions: UiSelectOption[];
  debtOptions: UiSelectOption[];
  recurringOptions: UiSelectOption[];
  installmentOptions: UiSelectOption[];
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function onSaved() {
    // Dismiss the originating suggestion only on a real save (Trigger A).
    if (suggestionId !== undefined) {
      await dismissSuggestionAction(suggestionId);
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogTitle>Link this debt&apos;s payments</DialogTitle>
        <DialogDescription>
          Author a match rule — refine the conditions (description, raw text, note, or amount) then save.
        </DialogDescription>
        {open && (
          <RuleEditor
            rule={seedRule({ debtId, debtName, seedDescription, ...(seedAmountCents !== undefined ? { seedAmountCents } : {}) })}
            categoryOptions={categoryOptions}
            tagOptions={tagOptions}
            debtOptions={debtOptions}
            recurringOptions={recurringOptions}
            installmentOptions={installmentOptions}
            onSaved={() => { void onSaved(); }}
            onClose={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
