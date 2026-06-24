"use client";

import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@upshot/ui";
import { linkDebtPaymentToDebtAction } from "@/server-actions/debts";

export function LinkDebtPayment({
  debts,
  defaultPattern,
  suggestionId,
  triggerLabel,
}: {
  debts: { id: string; name: string }[];
  defaultPattern: string;
  suggestionId?: string;
  triggerLabel: string;
}): ReactElement {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [debtId, setDebtId] = useState<string>(debts[0]?.id ?? "");

  function confirm(): void {
    const debt = debts.find((d) => d.id === debtId);
    if (!debt) return;
    start(async () => {
      await linkDebtPaymentToDebtAction({
        debtId: debt.id,
        debtName: debt.name,
        patterns: [defaultPattern],
        ...(suggestionId ? { suggestionId } : {}),
      });
      router.refresh();
    });
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{triggerLabel}</span>
      <select
        aria-label="Choose a debt"
        value={debtId}
        onChange={(e) => setDebtId(e.target.value)}
        style={{
          fontSize: 12,
          padding: "5px 8px",
          borderRadius: "var(--radius-data)",
          border: "1px solid var(--line)",
          background: "var(--surface-2)",
          color: "var(--text)",
        }}
      >
        {debts.map((d) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>
      <Button size="sm" onClick={confirm} disabled={pending || debtId === ""} aria-label="Link payment">
        Link payment
      </Button>
    </div>
  );
}
