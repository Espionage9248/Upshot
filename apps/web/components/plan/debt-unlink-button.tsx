"use client";

import { useTransition } from "react";
import type { ReactElement } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@upshot/ui";
import { clearDebtMatchedPaymentsAction } from "@/server-actions/debts";

/**
 * Unlink a debt's payment rule + wipe its matched payments (for repairing an
 * over-matched debt). Confirms before the destructive clear.
 */
export function DebtUnlinkButton({ debtId, debtName }: { debtId: string; debtName: string }): ReactElement {
  const router = useRouter();
  const [pending, start] = useTransition();

  function onClick(): void {
    if (!window.confirm(`Unlink ${debtName} and delete its matched payments? The rule is kept under Settings → Rules.`)) return;
    start(async () => {
      await clearDebtMatchedPaymentsAction(debtId);
      router.refresh();
    });
  }

  return (
    <Button variant="ghost" size="sm" onClick={onClick} disabled={pending}>
      Unlink &amp; clear payments
    </Button>
  );
}
