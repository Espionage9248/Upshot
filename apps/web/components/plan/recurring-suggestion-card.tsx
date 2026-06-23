"use client";

import { useTransition } from "react";
import type { ReactNode } from "react";
import { Card, CardHeader, CardTitle, CardBody, Badge, Money, Button } from "@upshot/ui";
import { useRouter } from "next/navigation";
import { toMonthlyCostCents } from "@upshot/core";
import { acceptSuggestionAction, dismissSuggestionAction } from "@/server-actions/recurring";
import type { RecurringRow } from "@/app/(app)/plan/recurring/data";

export function RecurringSuggestionCard({ row }: { row: RecurringRow }): ReactNode {
  const router = useRouter();
  const [acceptPending, startAccept] = useTransition();
  const [dismissPending, startDismiss] = useTransition();

  const monthlyCents = toMonthlyCostCents(row.amountCents, row.frequency);

  function handleAccept() {
    startAccept(async () => {
      await acceptSuggestionAction(row.id);
      router.refresh();
    });
  }

  function handleDismiss() {
    startDismiss(async () => {
      await dismissSuggestionAction(row.id);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{row.name}</CardTitle>
        <Badge tone={row.kind === "BILL" ? "expense" : "neutral"}>
          {row.kind === "BILL" ? "Bill" : "Subscription"}
        </Badge>
      </CardHeader>
      <CardBody>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>
              {row.frequency.charAt(0) + row.frequency.slice(1).toLowerCase()}
            </span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
              <Money cents={row.amountCents} kind="expense" size={15} weight={700} />
              {row.frequency !== "MONTHLY" && (
                <span style={{ fontSize: 10.5, color: "var(--text-3)" }}>
                  <Money cents={monthlyCents} kind="neutral" size={10.5} />/mo
                </span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            <Button
              size="sm"
              onClick={handleAccept}
              disabled={acceptPending || dismissPending}
              aria-label={`Accept ${row.name}`}
            >
              Accept
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              disabled={acceptPending || dismissPending}
              aria-label={`Dismiss ${row.name}`}
            >
              Dismiss
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
