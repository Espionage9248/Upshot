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
} from "@upshot/ui";
import { createInstallmentPlanAction } from "@/server-actions/installments";

/** Parse a dollar string to integer cents; null when not a valid positive amount. */
function dollarsToCents(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const cents = Math.round(Number(trimmed) * 100);
  return cents >= 0 ? cents : null;
}

/** Parse a whole-number count; null when invalid or zero. */
function parseCount(value: string): number | null {
  const trimmed = value.trim();
  const n = parseInt(trimmed, 10);
  if (isNaN(n) || n <= 0 || String(n) !== trimmed) return null;
  return n;
}

export interface InstallmentFormDialogProps {
  trigger?: React.ReactNode;
}

/**
 * Dialog for marking a purchase as a BNPL installment plan. Client component —
 * receives serializable props only, never imports @upshot/db. Calls
 * createInstallmentPlanAction then router.refresh().
 */
export function InstallmentFormDialog({ trigger }: InstallmentFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [merchant, setMerchant] = useState("");
  const [total, setTotal] = useState("");
  const [installments, setInstallments] = useState("");
  const [firstDue, setFirstDue] = useState("");
  const [frequencyDays, setFrequencyDays] = useState("14");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function reset() {
    setMerchant("");
    setTotal("");
    setInstallments("");
    setFirstDue("");
    setFrequencyDays("14");
    setError(null);
  }

  function submit() {
    setError(null);

    if (!merchant.trim()) {
      setError("Enter the merchant name.");
      return;
    }
    const totalCents = dollarsToCents(total);
    if (totalCents === null || totalCents === 0) {
      setError("Enter a valid total amount.");
      return;
    }
    const totalInstallments = parseCount(installments);
    if (totalInstallments === null) {
      setError("Enter the number of installments (e.g. 4).");
      return;
    }
    if (!firstDue.trim()) {
      setError("Enter the first due date.");
      return;
    }
    const freqDays = parseCount(frequencyDays);
    if (freqDays === null) {
      setError("Enter a valid frequency in days (e.g. 14).");
      return;
    }
    const installmentCents = Math.round(totalCents / totalInstallments);

    startTransition(async () => {
      const res = await createInstallmentPlanAction({
        merchant: merchant.trim(),
        totalCents,
        installmentCents,
        totalInstallments,
        frequencyDays: freqDays,
        firstDueDate: firstDue.trim(),
      });
      if (!res.ok) {
        setError(res.error.message);
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
        {trigger ?? <Button size="sm">Mark as BNPL</Button>}
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle>Mark as BNPL</DialogTitle>
        <DialogDescription>
          Record a buy-now-pay-later purchase to track your installment schedule.
        </DialogDescription>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input
            label="Merchant"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            placeholder="e.g. Afterpay – ACME Store"
          />
          <Input
            label="Total amount"
            mono
            inputMode="decimal"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            placeholder="0.00"
          />
          <Input
            label="Number of installments"
            mono
            inputMode="numeric"
            value={installments}
            onChange={(e) => setInstallments(e.target.value)}
            placeholder="4"
          />
          <Input
            label="First due date (YYYY-MM-DD)"
            mono
            value={firstDue}
            onChange={(e) => setFirstDue(e.target.value)}
            placeholder="2026-06-20"
          />
          <Input
            label="Frequency (days)"
            mono
            inputMode="numeric"
            value={frequencyDays}
            onChange={(e) => setFrequencyDays(e.target.value)}
            placeholder="14"
            error={error ?? undefined}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button variant="ghost" size="md" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button size="md" onClick={submit} loading={pending}>
              Add plan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
