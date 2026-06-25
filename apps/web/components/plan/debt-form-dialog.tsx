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
import { createDebtAction, updateDebtAction } from "@/server-actions/debts";
import type { DebtRow } from "@/app/(app)/plan/debts/data";

const DEBT_TYPE_OPTIONS = [
  { value: "CREDIT_CARD", label: "Credit card" },
  { value: "PERSONAL_LOAN", label: "Personal loan" },
  { value: "MORTGAGE", label: "Mortgage" },
  { value: "CAR", label: "Car loan" },
  { value: "TAX", label: "Tax debt" },
  { value: "OVERDRAFT", label: "Overdraft" },
  { value: "BNPL", label: "BNPL" },
] as const;

type DebtTypeValue = typeof DEBT_TYPE_OPTIONS[number]["value"];

/** Parse a dollar string to integer cents; null when not a valid positive amount. */
function dollarsToCents(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const cents = Math.round(Number(trimmed) * 100);
  return cents >= 0 ? cents : null;
}

/** Parse a rate string (e.g. "19.99") to a fraction (0.1999); null when invalid. */
function parseRate(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  if (isNaN(n) || n < 0 || n > 100) return null;
  return n / 100;
}

/** Display integer cents as a dollar string (e.g. 10000 → "100.00"). */
function centsToDollars(cents: number | null): string {
  return cents == null ? "" : (cents / 100).toFixed(2);
}

export interface DebtFormDialogProps {
  trigger?: React.ReactNode;
  initialValues?: DebtRow;
}

/**
 * Dialog for creating or editing a debt entry. Client component — receives
 * serializable props only, never imports @upshot/db. Calls createDebtAction
 * (add mode) or updateDebtAction (edit mode) then router.refresh().
 * When `initialValues` is provided, the dialog pre-populates fields, the title
 * becomes "Edit debt", and the submit button reads "Save".
 */
export function DebtFormDialog({ trigger, initialValues }: DebtFormDialogProps) {
  const isEdit = initialValues !== undefined;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialValues?.name ?? "");
  const [type, setType] = useState<DebtTypeValue>((initialValues?.type as DebtTypeValue) ?? "CREDIT_CARD");
  const [balance, setBalance] = useState(centsToDollars(initialValues?.currentBalanceCents ?? null));
  const [limit, setLimit] = useState(centsToDollars(initialValues?.creditLimitCents ?? null));
  const [payment, setPayment] = useState(centsToDollars(initialValues?.monthlyPaymentCents ?? null));
  const [rate, setRate] = useState(
    initialValues?.interestRate != null ? (initialValues.interestRate * 100).toString() : "",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentPatterns, setPaymentPatterns] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function reset() {
    setName(initialValues?.name ?? "");
    setType((initialValues?.type as DebtTypeValue) ?? "CREDIT_CARD");
    setBalance(centsToDollars(initialValues?.currentBalanceCents ?? null));
    setLimit(centsToDollars(initialValues?.creditLimitCents ?? null));
    setPayment(centsToDollars(initialValues?.monthlyPaymentCents ?? null));
    setRate(initialValues?.interestRate != null ? (initialValues.interestRate * 100).toString() : "");
    setPaymentPatterns("");
    setErrors({});
  }

  function submit() {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Enter a name for this debt.";
    const balanceCents = dollarsToCents(balance);
    if (balanceCents === null) next.balance = "Enter a valid balance.";
    const paymentCents = dollarsToCents(payment);
    if (paymentCents === null) next.payment = "Enter a valid monthly payment.";
    const creditLimitCents = limit.trim() ? dollarsToCents(limit) : null;
    if (limit.trim() && creditLimitCents === null) next.limit = "Enter a valid credit limit.";
    setErrors(next);
    if (Object.keys(next).length) return;

    const interestRate = parseRate(rate);

    startTransition(async () => {
      if (isEdit && initialValues) {
        const res = await updateDebtAction({
          ...initialValues,
          name: name.trim(),
          type,
          currentBalanceCents: balanceCents!,
          creditLimitCents: creditLimitCents ?? null,
          monthlyPaymentCents: paymentCents!,
          interestRate,
        });
        if (!res.ok) {
          setErrors({ form: res.error.message });
          return;
        }
        setOpen(false);
        router.refresh();
        return;
      }
      const res = await createDebtAction({
        name: name.trim(),
        type,
        currentBalanceCents: balanceCents!,
        originalBalanceCents: null,
        creditLimitCents: creditLimitCents ?? null,
        monthlyPaymentCents: paymentCents!,
        minimumPaymentCents: null,
        interestRate,
        monthlyFeeCents: null,
        feeDueDay: null,
        payoffPriority: 999,
        includeInSnowball: true,
        includeInNetWorth: true,
        matchRuleId: null,
        accountNumber: null,
        institutionName: null,
        notes: null,
        paymentPatterns: paymentPatterns.split(",").map((s) => s.trim()).filter(Boolean),
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
        {trigger ?? <Button size="sm">{isEdit ? "Edit debt" : "Add debt"}</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{isEdit ? "Edit debt" : "Add a debt"}</DialogTitle>
        <DialogDescription>
          {isEdit ? "Update the details for this debt." : "Track a new debt — credit card, loan, or other liability."}
        </DialogDescription>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Visa card"
            error={errors.name}
          />
          <UiSelect
            label="Type"
            value={type}
            onValueChange={(v) => setType(v as DebtTypeValue)}
            options={DEBT_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
          <Input
            label="Current balance"
            mono
            inputMode="decimal"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="0.00"
            error={errors.balance}
          />
          <Input
            label="Monthly payment"
            mono
            inputMode="decimal"
            value={payment}
            onChange={(e) => setPayment(e.target.value)}
            placeholder="0.00"
            error={errors.payment}
          />
          <Input
            label="Credit limit (optional)"
            mono
            inputMode="decimal"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            placeholder="0.00"
            error={errors.limit}
          />
          <Input
            label="Interest rate % p.a. (optional)"
            mono
            inputMode="decimal"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="e.g. 19.99"
          />
          <Input
            label="Payment match pattern(s)"
            value={paymentPatterns}
            onChange={(e) => setPaymentPatterns(e.target.value)}
            placeholder="e.g. ZipMoney, ZipPay, Zip"
            hint="Comma-separated names — debit transactions matching these are auto-linked as payments."
          />
          {errors.form && (
            <span style={{ color: "var(--expense)", fontSize: "11.5px" }}>{errors.form}</span>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button variant="ghost" size="md" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button size="md" onClick={submit} loading={pending}>
              {isEdit ? "Save" : "Add debt"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
