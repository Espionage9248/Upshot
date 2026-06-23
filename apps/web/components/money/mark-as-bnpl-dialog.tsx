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
import { createInstallmentFromTransactionAction } from "@/server-actions/installments";

export interface MarkAsBnplDialogProps {
  txId: string;
  txDate: string;
  amountCents: number;
  description: string;
}

/**
 * Dialog (Path A): convert a known expense transaction into a BNPL installment
 * plan. The per-installment amount is read-only — it is always the transaction
 * debit — so the user only supplies merchant, total count, and how many are paid.
 *
 * Client component — never imports @upshot/db. Integer cents only.
 */
export function MarkAsBnplDialog({ txId, txDate, amountCents, description }: MarkAsBnplDialogProps) {
  const [open, setOpen] = useState(false);
  const [merchant, setMerchant] = useState(description);
  const [totalInstallments, setTotalInstallments] = useState("4");
  const [paid, setPaid] = useState(1);
  const [errors, setErrors] = useState<{ merchant?: string; installments?: string; form?: string }>({});
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const installmentCents = Math.abs(amountCents);
  const total = parseInt(totalInstallments) || 4;

  function reset() {
    setMerchant(description);
    setTotalInstallments("4");
    setPaid(1);
    setErrors({});
  }

  function adjustPaid(delta: number) {
    setPaid((prev) => Math.min(Math.max(1, prev + delta), total));
  }

  function submit() {
    setErrors({});
    const errs: typeof errors = {};

    if (!merchant.trim()) {
      errs.merchant = "Enter the merchant name.";
    }
    if (!total || total < 1) {
      errs.installments = "Enter the number of installments (e.g. 4).";
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    startTransition(async () => {
      const res = await createInstallmentFromTransactionAction({
        transactionId: txId,
        txDate,
        merchant: merchant.trim(),
        installmentCents,
        totalInstallments: total,
        installmentsPaid: paid,
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
        <Button variant="ghost" size="sm">Mark as BNPL</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Mark as BNPL</DialogTitle>
        <DialogDescription>
          Convert this transaction into a buy-now-pay-later installment plan.
        </DialogDescription>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Per-installment amount — read-only; always equals the tx debit. */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>
              Per-installment amount
            </span>
            <Money cents={installmentCents} kind="expense" />
          </div>

          <Input
            label="Merchant"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            placeholder="e.g. Afterpay – ACME Store"
            error={errors.merchant}
          />

          <Input
            label="Number of installments"
            type="number"
            mono
            inputMode="numeric"
            value={totalInstallments}
            onChange={(e) => {
              setTotalInstallments(e.target.value);
              // Clamp paid when total decreases.
              const newTotal = parseInt(e.target.value) || 4;
              setPaid((prev) => Math.min(prev, newTotal));
            }}
            placeholder="4"
            error={errors.installments}
          />

          {/* Paid stepper — no UI primitive; built inline. */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>
              Installments already paid
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Decrease installments paid"
                disabled={paid <= 1 || pending}
                onClick={() => adjustPaid(-1)}
              >
                −
              </Button>
              <span
                data-testid="paid-value"
                style={{ fontSize: 14, fontWeight: 700, minWidth: 20, textAlign: "center" }}
              >
                {paid}
              </span>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Increase installments paid"
                disabled={paid >= total || pending}
                onClick={() => adjustPaid(1)}
              >
                +
              </Button>
            </div>
          </div>

          {errors.form && (
            <p role="alert" style={{ fontSize: 11.5, color: "var(--expense)", margin: 0 }}>
              {errors.form}
            </p>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button variant="ghost" size="md" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button size="md" aria-label="Add plan" onClick={submit} loading={pending}>
              Add plan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
