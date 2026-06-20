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
import { recordValuationAction } from "@/server-actions/assets";
import type { AssetRow } from "@/app/(app)/net-worth/data";

/** Parse a dollar string to integer cents; null when not a valid non-negative amount. */
function dollarsToCents(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  return Math.round(Number(trimmed) * 100);
}

const dateInputStyle: React.CSSProperties = {
  height: 38,
  padding: "0 12px",
  borderRadius: "var(--radius-data)",
  border: "1px solid var(--line)",
  background: "var(--surface-2)",
  color: "var(--text)",
  fontSize: 13.5,
};

/**
 * Per-asset "Record valuation" dialog for /net-worth. Mirrors asset-form
 * (Radix Dialog + dollars→integer-cents money input + inline ActionResult error
 * + router.refresh on success). Calls the D4 recordValuationAction, which appends
 * an asset_valuations row and bumps the asset's current value. Client component —
 * serializable props only, never imports @upshot/db.
 */
export function ValuationForm({ asset }: { asset: AssetRow }) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [valuedAt, setValuedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    const cents = dollarsToCents(amount);
    if (cents === null) {
      setError("Enter a valid amount.");
      return;
    }
    if (!valuedAt) {
      setError("Choose a date.");
      return;
    }
    startTransition(async () => {
      const res = await recordValuationAction(asset.id, cents, valuedAt);
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  const dateId = `valuation-date-${asset.id}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={`Record valuation for ${asset.name}`}>
          Record valuation
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle>Record valuation</DialogTitle>
        <DialogDescription>
          Log a new value for {asset.name} as at a date.
        </DialogDescription>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input
            label="New value"
            mono
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label htmlFor={dateId} style={{ fontSize: 12, fontWeight: 500, color: "var(--text-2)" }}>
              As at
            </label>
            <input
              id={dateId}
              type="date"
              value={valuedAt}
              onChange={(e) => setValuedAt(e.target.value)}
              style={dateInputStyle}
            />
          </div>
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
