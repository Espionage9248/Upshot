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
import { createInstallmentByMatchAction } from "@/server-actions/installments";

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
 * Dialog for adding a BNPL plan (Path B — auto-match recent payments). Client
 * component — receives serializable props only, never imports @upshot/db. Calls
 * createInstallmentByMatchAction then router.refresh(). frequencyDays is fixed
 * at 14 (Afterpay model); no frequency or first-due fields.
 */
export function InstallmentFormDialog({ trigger }: InstallmentFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [count, setCount] = useState("4");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [matchedMsg, setMatchedMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function reset() {
    setMerchant("");
    setAmount("");
    setCount("4");
    setErrors({});
    setMatchedMsg(null);
  }

  function submit() {
    const next: Record<string, string> = {};

    if (!merchant.trim()) next.merchant = "Enter the merchant name.";
    const installmentCents = dollarsToCents(amount);
    if (installmentCents === null || installmentCents === 0)
      next.amount = "Enter a valid per-installment amount.";
    const totalInstallments = parseCount(count);
    if (totalInstallments === null) next.count = "Enter the number of installments (e.g. 4).";

    setErrors(next);
    if (Object.keys(next).length) return;

    startTransition(async () => {
      const res = await createInstallmentByMatchAction({
        merchant: merchant.trim(),
        installmentCents: installmentCents!,
        totalInstallments: totalInstallments!,
      });
      if (!res.ok) {
        setErrors({ form: res.error.message });
        return;
      }
      setMatchedMsg(`Matched ${res.data.matched} recent payment(s)`);
      setTimeout(() => {
        reset();
        setOpen(false);
        router.refresh();
      }, 1200);
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        {trigger ?? <Button size="sm">Add BNPL plan</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Add BNPL plan</DialogTitle>
        <DialogDescription>
          Enter a merchant name and per-installment amount — recent payments will be
          auto-matched to this plan.
        </DialogDescription>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input
            label="Merchant"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            placeholder="e.g. Afterpay – ACME Store"
            error={errors.merchant}
          />
          <Input
            label="Per-installment amount"
            mono
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            error={errors.amount}
          />
          <Input
            label="Number of installments"
            mono
            inputMode="numeric"
            value={count}
            onChange={(e) => setCount(e.target.value)}
            placeholder="4"
            error={errors.count}
          />
          {matchedMsg && (
            <span style={{ color: "var(--saved)", fontSize: "11.5px" }}>{matchedMsg}</span>
          )}
          {errors.form && (
            <span style={{ color: "var(--expense)", fontSize: "11.5px" }}>{errors.form}</span>
          )}
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
