"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  Button,
  Input,
  UiSelect,
} from "@upshot/ui";
import { transferAllocationAction } from "@/server-actions/budget";

export interface TransferAccountOption {
  id: string;
  name: string;
}

export interface TransferDialogProps {
  month: string;
  /** The saver this dialog moves allocation FROM. */
  fromAccountId: string;
  fromAccountName: string;
  /** Candidate destinations (other savers / emergency fund). */
  destinations: TransferAccountOption[];
}

/** Parse a dollar string to integer cents; null when not a valid positive amount. */
function dollarsToCents(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const cents = Math.round(Number(trimmed) * 100);
  return cents > 0 ? cents : null;
}

/**
 * Transfer dialog — moves allocation between savers for the month via the A5
 * transferAllocationAction. Client component: serializable props only, never
 * imports @upshot/db. Renders the ActionResult / overdraw error path inline.
 */
export function TransferDialog({ month, fromAccountId, fromAccountName, destinations }: TransferDialogProps) {
  const [open, setOpen] = useState(false);
  const [toId, setToId] = useState<string | undefined>(destinations[0]?.id);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    setError(null);
    const cents = dollarsToCents(amount);
    if (cents === null) {
      setError("Enter a valid amount.");
      return;
    }
    if (!toId) {
      setError("Choose a destination.");
      return;
    }
    startTransition(async () => {
      const res = await transferAllocationAction(fromAccountId, toId, month, cents);
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      if (!res.data.ok) {
        setError("Not enough allocation to move that much.");
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Move
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Move from {fromAccountName}</DialogTitle>
        <DialogDescription>Reallocate budget to another saver for {month}.</DialogDescription>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <UiSelect
            label="To"
            value={toId}
            onValueChange={setToId}
            placeholder="Choose a saver"
            options={destinations.map((d) => ({ value: d.id, label: d.name }))}
          />
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
              Move
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
