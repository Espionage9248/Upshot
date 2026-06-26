"use client";

/**
 * Toaster — self-contained, single-user toast surface.
 * Imperative `toast(...)` publishes to a module-level bus; one mounted <Toaster/>
 * renders + auto-dismisses. role="status" + aria-live="polite" per the design spec.
 * Tone shows as a coloured left edge (never colour-only — the title carries meaning).
 */
import { useEffect, useState } from "react";
import { cn } from "../lib/cn";

export type ToastTone = "success" | "locked" | "neutral" | "warn";
export interface ToastInput {
  title: string;
  body?: string;
  tone?: ToastTone;
}
interface ToastItem extends Omit<ToastInput, "tone"> {
  id: number;
  tone: ToastTone;
}

const TONE_VAR: Record<ToastTone, string> = {
  success: "var(--income)",
  locked: "var(--coral)",
  neutral: "var(--text-2)",
  warn: "var(--warn)",
};

const DURATION_MS = 3200;
let counter = 0;
const listeners = new Set<(t: ToastItem) => void>();

/** Publish a toast. Safe to call from any client handler. */
export function toast(input: ToastInput): void {
  const item: ToastItem = { id: ++counter, tone: "neutral", ...input };
  for (const l of listeners) l(item);
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const onToast = (t: ToastItem) => {
      setItems((prev) => [...prev, t]);
      setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== t.id)), DURATION_MS);
    };
    listeners.add(onToast);
    return () => { listeners.delete(onToast); };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-[360px]"
    >
      {items.map((t) => (
        <div
          key={t.id}
          className={cn(
            "rounded-[var(--radius-data)] bg-[var(--surface-2)] px-4 py-3",
            "border border-[var(--line)]",
          )}
          style={{ borderLeft: `3px solid ${TONE_VAR[t.tone]}`, boxShadow: "var(--elev-pop)" }}
        >
          <div className="text-[13px] font-semibold text-[var(--text)]">{t.title}</div>
          {t.body && <div className="mt-0.5 text-[12px] text-[var(--text-2)]">{t.body}</div>}
        </div>
      ))}
    </div>
  );
}
