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
  Money,
} from "@upshot/ui";
import { markPurchaseFromTransactionAction } from "@/server-actions/purchases";

export interface MarkAsPurchaseDialogProps {
  txId: string;
  txDate: string;
  amountCents: number;
  description: string;
}

/**
 * Dialog: convert a known expense transaction into a completed purchase record.
 * The price is read-only — always the transaction debit. Only the name is editable.
 *
 * Client component — never imports @upshot/db. Integer cents only.
 */
export function MarkAsPurchaseDialog({ txId, txDate, amountCents, description }: MarkAsPurchaseDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(description);
  const [errors, setErrors] = useState<{ name?: string; form?: string }>({});
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const priceCents = Math.abs(amountCents);

  function reset() {
    setName(description);
    setErrors({});
  }

  function submit() {
    setErrors({});
    const errs: typeof errors = {};

    if (!name.trim()) {
      errs.name = "Enter the purchase name.";
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    startTransition(async () => {
      const res = await markPurchaseFromTransactionAction({
        transactionId: txId,
        customName: name.trim(),
        priceCents,
        purchaseDate: txDate,
      });
      if (!res.ok) {
        setErrors({ form: res.error.message });
        return;
      }
      reset();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">Mark as purchase</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Mark as purchase</DialogTitle>
        <DialogDescription>
          Record this transaction as a completed purchase.
        </DialogDescription>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Price — read-only; always equals the tx debit. */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>
              Price
            </span>
            <Money cents={priceCents} kind="expense" />
          </div>

          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sony WH-1000XM5"
            error={errors.name}
          />

          {errors.form && (
            <p role="alert" style={{ fontSize: 11.5, color: "var(--expense)", margin: 0 }}>
              {errors.form}
            </p>
          )}

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
