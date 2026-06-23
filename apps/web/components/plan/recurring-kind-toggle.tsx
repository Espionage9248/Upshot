"use client";

import { useTransition } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@upshot/ui";
import { setRecurringKindAction } from "@/server-actions/recurring";

type RecurringKind = "BILL" | "SUBSCRIPTION";

/**
 * Clickable Bill/Subscription badge. Clicking flips the recurring item's kind
 * (the heuristic default is often wrong) via setRecurringKindAction, then
 * refreshes. Renders as the same Badge as before, wrapped in a button.
 */
export function RecurringKindToggle({ id, kind }: { id: string; kind: RecurringKind }): ReactNode {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next: RecurringKind = kind === "BILL" ? "SUBSCRIPTION" : "BILL";
    startTransition(async () => {
      await setRecurringKindAction(id, next);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-label="Toggle recurring kind"
      style={{
        background: "none",
        border: "none",
        padding: 0,
        cursor: pending ? "default" : "pointer",
        opacity: pending ? 0.6 : 1,
      }}
    >
      <Badge tone={kind === "BILL" ? "expense" : "neutral"}>
        {kind === "BILL" ? "Bill" : "Subscription"}
      </Badge>
    </button>
  );
}
