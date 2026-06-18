"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  Button,
  Input,
} from "@upshot/ui";
import { setAllocationAction } from "@/server-actions/budget";

export interface AllocateDialogProps {
  accountId: string;
  accountName: string;
  month: string;
  /** Current allocation in cents — prefills the field (dollars). */
  currentCents: number;
}

/** Parse a dollar string to integer cents; null when not a valid non-negative amount. */
function dollarsToCents(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  return Math.round(Number(trimmed) * 100);
}

/**
 * Allocate dialog — sets a saver's allocation for the month via the A5
 * setAllocationAction. Client component: receives serializable props only, never
 * imports @upshot/db. Renders the ActionResult error path inline.
 */
export function AllocateDialog({ accountId, accountName, month, currentCents }: AllocateDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState((currentCents / 100).toFixed(2));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    const cents = dollarsToCents(amount);
    if (cents === null) {
      setError("Enter a valid amount.");
      return;
    }
    startTransition(async () => {
      const res = await setAllocationAction(accountId, month, cents);
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      if (!res.data.ok) {
        setError("That account could not be found.");
        return;
      }
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          Allocate
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle>Allocate to {accountName}</DialogTitle>
        <DialogDescription>Set this saver&rsquo;s budget for {month}.</DialogDescription>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input
            label="Amount"
            mono
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={error ?? undefined}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button variant="ghost" size="md" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button size="md" onClick={submit} loading={pending}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
