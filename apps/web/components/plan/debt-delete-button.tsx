"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@upshot/ui";
import { deleteDebtAction } from "@/server-actions/debts";

export function DebtDeleteButton({ debtId, debtName }: { debtId: string; debtName?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    const label = debtName ? `"${debtName}"` : "this debt";
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteDebtAction(debtId);
      router.push("/plan/debts");
    });
  }

  return (
    <Button
      variant="danger"
      size="sm"
      aria-label="Delete debt"
      onClick={handleDelete}
      disabled={pending}
    >
      Delete debt
    </Button>
  );
}
