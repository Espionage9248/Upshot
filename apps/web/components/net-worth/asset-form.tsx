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
  Textarea,
  UiSelect,
  UiSwitch,
  type UiSelectOption,
} from "@upshot/ui";
import { createAssetAction, updateAssetAction } from "@/server-actions/assets";
import type { AssetRow } from "@/app/(app)/net-worth/data";

/** Parse a dollar string to integer cents; null when not a valid non-negative amount. */
function dollarsToCents(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  return Math.round(Number(trimmed) * 100);
}

export type AssetFormProps =
  | { mode: "create"; typeOptions: UiSelectOption[] }
  | { mode: "update"; typeOptions: UiSelectOption[]; asset: AssetRow };

/**
 * Create/Edit dialog for an asset. Mirrors allocate-dialog (Radix Dialog +
 * dollars→integer-cents money input). Client component — serializable props
 * only, never imports @upshot/db. Calls the D4 create/update actions and renders
 * the ActionResult error path inline. On success it refreshes the route.
 */
export function AssetForm(props: AssetFormProps) {
  const { mode, typeOptions } = props;
  const existing = mode === "update" ? props.asset : null;
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(existing?.name ?? "");
  const [type, setType] = useState<string | undefined>(existing?.type ?? typeOptions[0]?.value);
  const [amount, setAmount] = useState(existing ? (existing.valueCents / 100).toFixed(2) : "");
  const [institution, setInstitution] = useState(existing?.institution ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [includeInNetWorth, setIncludeInNetWorth] = useState(existing?.includeInNetWorth ?? true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Enter a name.");
      return;
    }
    if (!type) {
      setError("Choose a type.");
      return;
    }
    const cents = dollarsToCents(amount);
    if (cents === null) {
      setError("Enter a valid amount.");
      return;
    }
    const fields = {
      name: trimmedName,
      type: type as AssetRow["type"],
      valueCents: cents,
      institution: institution.trim() || null,
      notes: notes.trim() || null,
      includeInNetWorth,
    };
    startTransition(async () => {
      const res =
        mode === "update" && existing
          ? await updateAssetAction({ ...existing, ...fields })
          : await createAssetAction(fields);
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  const triggerLabel = mode === "update" ? `Edit ${existing?.name}` : "Add asset";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "update" ? (
          <Button variant="ghost" size="sm" aria-label={triggerLabel}>
            Edit
          </Button>
        ) : (
          <Button variant="primary" size="sm">
            + Add asset
          </Button>
        )}
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle>{mode === "update" ? "Edit asset" : "Add asset"}</DialogTitle>
        <DialogDescription>
          Assets are tracked locally and counted toward your net worth.
        </DialogDescription>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <UiSelect
            label="Type"
            value={type}
            onValueChange={setType}
            placeholder="Choose a type"
            options={typeOptions}
          />
          <Input
            label="Value"
            mono
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Input
            label="Institution"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
          />
          <Textarea
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-2)" }}>
              Include in net worth
            </span>
            <UiSwitch
              checked={includeInNetWorth}
              onCheckedChange={setIncludeInNetWorth}
              aria-label="Include in net worth"
            />
          </label>
          {error && (
            <p role="alert" style={{ fontSize: 11.5, color: "var(--expense)", margin: 0, lineHeight: 1.4 }}>
              {error}
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
