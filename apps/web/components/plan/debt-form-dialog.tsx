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
import { createDebtAction } from "@/server-actions/debts";

const DEBT_TYPE_OPTIONS = [
  { value: "CREDIT_CARD", label: "Credit card" },
  { value: "PERSONAL_LOAN", label: "Personal loan" },
  { value: "MORTGAGE", label: "Mortgage" },
  { value: "CAR", label: "Car loan" },
  { value: "TAX", label: "Tax debt" },
  { value: "OVERDRAFT", label: "Overdraft" },
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

export interface DebtFormDialogProps {
  trigger?: React.ReactNode;
}

/**
 * Dialog for creating a new debt entry. Client component — receives serializable
 * props only, never imports @upshot/db. Calls createDebtAction then router.refresh().
 */
export function DebtFormDialog({ trigger }: DebtFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<DebtTypeValue>("CREDIT_CARD");
  const [balance, setBalance] = useState("");
  const [limit, setLimit] = useState("");
  const [payment, setPayment] = useState("");
  const [rate, setRate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function reset() {
    setName("");
    setType("CREDIT_CARD");
    setBalance("");
    setLimit("");
    setPayment("");
    setRate("");
    setError(null);
  }

  function submit() {
    setError(null);
    if (!name.trim()) {
      setError("Enter a name for this debt.");
      return;
    }
    const balanceCents = dollarsToCents(balance);
    if (balanceCents === null) {
      setError("Enter a valid balance.");
      return;
    }
    const paymentCents = dollarsToCents(payment);
    if (paymentCents === null) {
      setError("Enter a valid monthly payment.");
      return;
    }
    const creditLimitCents = limit.trim() ? dollarsToCents(limit) : null;
    if (limit.trim() && creditLimitCents === null) {
      setError("Enter a valid credit limit.");
      return;
    }
    const interestRate = parseRate(rate);

    startTransition(async () => {
      const res = await createDebtAction({
        name: name.trim(),
        type,
        currentBalanceCents: balanceCents,
        originalBalanceCents: null,
        creditLimitCents: creditLimitCents ?? null,
        monthlyPaymentCents: paymentCents,
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
        {trigger ?? <Button size="sm">Add debt</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Add a debt</DialogTitle>
        <DialogDescription>
          Track a new debt — credit card, loan, or other liability.
        </DialogDescription>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Visa card"
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
          />
          <Input
            label="Monthly payment"
            mono
            inputMode="decimal"
            value={payment}
            onChange={(e) => setPayment(e.target.value)}
            placeholder="0.00"
          />
          <Input
            label="Credit limit (optional)"
            mono
            inputMode="decimal"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            placeholder="0.00"
          />
          <Input
            label="Interest rate % p.a. (optional)"
            mono
            inputMode="decimal"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="e.g. 19.99"
            error={error ?? undefined}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button variant="ghost" size="md" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button size="md" onClick={submit} loading={pending}>
              Add debt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
