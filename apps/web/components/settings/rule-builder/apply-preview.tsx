"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { LoadedRule } from "@upshot/core";
import { Button } from "@upshot/ui";
import { previewRuleAction, applyRuleAction } from "@/server-actions/rules";

/**
 * Preview + Apply affordance for a rule. Preview counts how many stored
 * transactions the (draft) rule would match. Apply operates on a SAVED rule by
 * id — disabled with a hint when `saved` is false. Renders the three result
 * shapes: clean success (applied count), amber non-fatal warning (local write
 * ok, Up push failed), red error. Client component — serializable props only.
 */
export function ApplyPreview({ draft, saved }: { draft: LoadedRule; saved: boolean }) {
  const router = useRouter();
  const [count, setCount] = useState<number | null>(null);
  const [applied, setApplied] = useState<number | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onPreview() {
    setError(null);
    startTransition(async () => {
      const res = await previewRuleAction(draft);
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      setCount(res.data.count);
    });
  }

  function onApply() {
    setError(null);
    setWarning(null);
    setApplied(null);
    startTransition(async () => {
      const res = await applyRuleAction(draft.rule.id);
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      setApplied(res.data.applied);
      if (res.data.warning) setWarning("Applied locally — couldn't sync to Up.");
      router.refresh();
    });
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        marginTop: 14,
        paddingTop: 14,
        borderTop: "1px solid var(--line-soft)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Button type="button" variant="secondary" size="sm" onClick={onPreview} disabled={pending}>
          Preview
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onApply} disabled={pending || !saved}>
          Apply
        </Button>
        {count !== null && (
          <span style={{ fontSize: 12, color: "var(--text-2)" }}>
            Matches {count} transactions
          </span>
        )}
      </div>

      {!saved && (
        <p style={{ fontSize: 11.5, color: "var(--text-3)", margin: 0 }}>
          Save the rule first to apply it to existing transactions.
        </p>
      )}
      {applied !== null && !warning && (
        <p role="status" style={{ fontSize: 11.5, color: "var(--income)", margin: 0 }}>
          Applied to {applied} transactions.
        </p>
      )}
      {warning && (
        <p role="status" style={{ fontSize: 11.5, color: "var(--warn)", margin: 0 }}>
          {warning}
        </p>
      )}
      {error && (
        <p role="alert" style={{ fontSize: 11.5, color: "var(--expense)", margin: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
}
