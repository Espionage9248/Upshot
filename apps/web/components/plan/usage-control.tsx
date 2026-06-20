"use client";

import { useState, useTransition } from "react";
import type { ReactNode } from "react";
import { Button, Input, Money } from "@upshot/ui";
import { useRouter } from "next/navigation";
import { costPerUseCents } from "@upshot/core";
import { setUsageAction } from "@/server-actions/recurring";

interface UsageControlProps {
  id: string;
  usageCount: number;
  monthlyCostCents: number;
}

export function UsageControl({ id, usageCount, monthlyCostCents }: UsageControlProps): ReactNode {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(usageCount));

  const perUseCents = costPerUseCents(monthlyCostCents, usageCount);

  function handleSave() {
    const count = parseInt(value, 10);
    if (isNaN(count) || count < 0) return;
    startTransition(async () => {
      await setUsageAction(id, count);
      router.refresh();
      setEditing(false);
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 11.5,
          color: "var(--text-3)",
        }}
      >
        <span>Cost per use</span>
        <span>
          {perUseCents !== null ? (
            <Money cents={perUseCents} kind="expense" size={11.5} />
          ) : (
            <span style={{ color: "var(--text-3)" }}>—</span>
          )}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {editing ? (
          <>
            <Input
              type="number"
              min={0}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              aria-label="Usage count"
              style={{ width: 72, height: 28, fontSize: 12 }}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              disabled={pending}
            >
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setValue(String(usageCount));
                setEditing(false);
              }}
            >
              Cancel
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing(true)}
            aria-label="Set usage count"
          >
            {usageCount} use{usageCount === 1 ? "" : "s"}/mo
          </Button>
        )}
      </div>
    </div>
  );
}
