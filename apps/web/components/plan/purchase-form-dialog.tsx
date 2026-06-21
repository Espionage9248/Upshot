"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, Button, Input } from "@upshot/ui";
import { createPurchaseAction, scrapePurchaseUrlAction } from "@/server-actions/purchases";

function dollarsToCents(v: string): number | null {
  const t = v.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  return Math.round(Number(t) * 100);
}

export function PurchaseFormDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [priority, setPriority] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [scraping, startScrape] = useTransition();
  const router = useRouter();

  function reset() { setName(""); setPrice(""); setTargetDate(""); setPriority(""); setUrl(""); setNotes(""); setErrors({}); }

  function fetchFromUrl() {
    if (!url.trim()) { setErrors({ url: "Enter a URL first." }); return; }
    startScrape(async () => {
      const res = await scrapePurchaseUrlAction(url.trim());
      if (res.ok) {
        if (!name && res.data.name) setName(res.data.name);
        if (!price && res.data.priceCents != null) setPrice((res.data.priceCents / 100).toFixed(2));
      }
    });
  }

  function submit() {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Enter a name.";
    const priceCents = price.trim() ? dollarsToCents(price) : null;
    if (price.trim() && priceCents === null) next.price = "Enter a valid price.";
    setErrors(next);
    if (Object.keys(next).length) return;
    startTransition(async () => {
      const res = await createPurchaseAction({
        customName: name.trim(), targetPriceCents: priceCents ?? undefined,
        targetDate: targetDate.trim() || null, priority: priority.trim() ? Number(priority) : null,
        url: url.trim() || null, notes: notes.trim() || null,
      });
      if (!res.ok) { setErrors({ form: res.error.message }); return; }
      reset(); setOpen(false); router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>{trigger ?? <Button size="sm">Add to wishlist</Button>}</DialogTrigger>
      <DialogContent>
        <DialogTitle>Add to wishlist</DialogTitle>
        <DialogDescription>Track something you want to buy — set a target price and date for a save-rate hint.</DialogDescription>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <Input label="URL (optional)" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" error={errors.url} />
            </div>
            <Button variant="ghost" size="md" onClick={fetchFromUrl} loading={scraping}>Fetch from URL</Button>
          </div>
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} placeholder="e.g. Sony WH-1000XM5" />
          <Input label="Target price" mono inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} error={errors.price} placeholder="0.00" />
          <Input label="Target date (YYYY-MM-DD, optional)" mono value={targetDate} onChange={(e) => setTargetDate(e.target.value)} placeholder="2026-12-01" />
          <Input label="Priority (1–5, optional)" mono inputMode="numeric" value={priority} onChange={(e) => setPriority(e.target.value)} placeholder="1" />
          <Input label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          {errors.form && <p role="alert" style={{ fontSize: 11.5, color: "var(--expense)", margin: 0 }}>{errors.form}</p>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button variant="ghost" size="md" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
            <Button size="md" onClick={submit} loading={pending}>Add</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
