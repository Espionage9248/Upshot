"use client";

import { useTransition } from "react";
import type { ReactElement } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@upshot/ui";
import { linkDebtPaymentToDebtAction } from "@/server-actions/debts";

/**
 * Trigger B (spec §5.2): from the debt detail page, link this debt's payment.
 * Prompts for the transaction description to match (mirrors the planner's
 * window.prompt idiom), then creates the rule via the link action.
 */
export function DebtLinkPaymentButton({ debtId, debtName }: { debtId: string; debtName: string }): ReactElement {
  const router = useRouter();
  const [pending, start] = useTransition();

  function onClick(): void {
    const pattern = window.prompt(`Match payments whose description contains… (for ${debtName})`);
    if (!pattern || pattern.trim() === "") return;
    start(async () => {
      await linkDebtPaymentToDebtAction({ debtId, debtName, patterns: [pattern.trim()] });
      router.refresh();
    });
  }

  return (
    <Button variant="ghost" size="sm" onClick={onClick} disabled={pending}>
      Link this debt&apos;s payment
    </Button>
  );
}
