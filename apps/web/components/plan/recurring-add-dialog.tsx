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
import { createRecurringAction } from "@/server-actions/recurring";

const FREQUENCY_OPTIONS = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "FORTNIGHTLY", label: "Fortnightly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "YEARLY", label: "Yearly" },
] as const;

const KIND_OPTIONS = [
  { value: "SUBSCRIPTION", label: "Subscription" },
  { value: "BILL", label: "Bill" },
] as const;

type FrequencyValue = typeof FREQUENCY_OPTIONS[number]["value"];
type KindValue = typeof KIND_OPTIONS[number]["value"];

/** Parse a dollar string to integer cents; null when invalid or not positive. */
function dollarsToCents(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const cents = Math.round(Number(trimmed) * 100);
  return cents > 0 ? cents : null;
}

/**
 * Dialog for manually adding a recurring subscription or bill.
 * Creates an ACTIVE (not auto-detected) row immediately.
 */
export function RecurringAddDialog(): React.ReactNode {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<FrequencyValue>("MONTHLY");
  const [kind, setKind] = useState<KindValue>("SUBSCRIPTION");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function reset() {
    setName("");
    setAmount("");
    setFrequency("MONTHLY");
    setKind("SUBSCRIPTION");
    setErrors({});
  }

  function submit() {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Enter a name for this recurring item.";
    const amountCents = dollarsToCents(amount);
    if (amountCents === null) next.amount = "Enter a valid amount greater than zero.";
    setErrors(next);
    if (Object.keys(next).length) return;

    startTransition(async () => {
      const res = await createRecurringAction({
        name: name.trim(),
        amountCents: amountCents!,
        frequency,
        kind,
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
        <Button size="sm">+ Add recurring</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Add a recurring item</DialogTitle>
        <DialogDescription>
          Manually track a subscription or bill that wasn&apos;t auto-detected.
        </DialogDescription>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Netflix"
            error={errors.name}
          />
          <Input
            label="Amount"
            mono
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            error={errors.amount}
          />
          <UiSelect
            label="Frequency"
            value={frequency}
            onValueChange={(v) => setFrequency(v as FrequencyValue)}
            options={FREQUENCY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
          <UiSelect
            label="Kind"
            value={kind}
            onValueChange={(v) => setKind(v as KindValue)}
            options={KIND_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
          {errors.form && (
            <span style={{ color: "var(--expense)", fontSize: "11.5px" }}>{errors.form}</span>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button variant="ghost" size="md" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button size="md" onClick={submit} loading={pending}>
              Add recurring
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
