"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
  UIcon,
} from "@upshot/ui";
import {
  setCategoryAction,
  setTagsAction,
  markSalaryAction,
  markTransferAction,
  markTaxDeductibleAction,
} from "@/server-actions/money";
import { MarkAsBnplDialog } from "./mark-as-bnpl-dialog";

export interface RowEditOption {
  value: string;
  label: string;
}

export interface RowEditPopoverProps {
  txId: string;
  categoryId: string | null;
  categoryOptions: RowEditOption[];
  tagOptions: RowEditOption[];
  activeTagIds: string[];
  isSalary: boolean;
  isTransfer: boolean;
  isTaxDeductible: boolean;
  amountCents: number;
  description: string;
  txDate: string;
}

/**
 * Per-row inline edit Popover for the Ledger. Client component: receives
 * serializable props only, never imports @upshot/db. Calls the B3 Server Actions
 * and renders BOTH the ActionResult error path (`ok === false`) and the B3
 * non-fatal warning path (`data.warning` — saved locally, Up push failed).
 */
export function RowEditPopover({
  txId,
  categoryId,
  categoryOptions,
  tagOptions,
  activeTagIds,
  isSalary,
  isTransfer,
  isTaxDeductible,
  amountCents,
  description,
  txDate,
}: RowEditPopoverProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  /** Run a category/tags action that may carry a non-fatal warning, then refresh. */
  function runWithWarning(fn: () => Promise<{ ok: true; data: { warning?: { message: string } } } | { ok: false; error: { message: string } }>) {
    setError(null);
    setWarning(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      if (res.data.warning) {
        setWarning("Saved locally — couldn't sync to Up.");
      }
      router.refresh();
    });
  }

  /** Run a local-only flag action (no warning path), then refresh. */
  function runFlag(fn: () => Promise<{ ok: true; data: void } | { ok: false; error: { message: string } }>) {
    setError(null);
    setWarning(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Edit transaction">
          <UIcon name="gear" size={14} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" style={{ width: 240, display: "flex", flexDirection: "column", gap: 12 }}>
        <Section title="Category">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {categoryOptions.map((opt) => (
              <ChoiceButton
                key={opt.value}
                label={opt.label}
                active={opt.value === categoryId}
                disabled={pending}
                onClick={() => runWithWarning(() => setCategoryAction(txId, opt.value))}
              />
            ))}
          </div>
        </Section>

        {tagOptions.length > 0 && (
          <Section title="Tags">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {tagOptions.map((opt) => {
                const active = activeTagIds.includes(opt.value);
                return (
                  <ChoiceButton
                    key={opt.value}
                    label={opt.label}
                    active={active}
                    disabled={pending}
                    onClick={() =>
                      runWithWarning(() =>
                        active
                          ? setTagsAction(txId, [], [opt.value])
                          : setTagsAction(txId, [opt.value], []),
                      )
                    }
                  />
                );
              })}
            </div>
          </Section>
        )}

        <Section title="Flags">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <ChoiceButton
              label="Salary"
              aria-label="Mark salary"
              active={isSalary}
              disabled={pending}
              onClick={() => runFlag(() => markSalaryAction(txId, !isSalary))}
            />
            <ChoiceButton
              label="Transfer"
              aria-label="Mark transfer"
              active={isTransfer}
              disabled={pending}
              onClick={() => runFlag(() => markTransferAction(txId, !isTransfer))}
            />
            <ChoiceButton
              label="Tax-deductible"
              aria-label="Mark tax-deductible"
              active={isTaxDeductible}
              disabled={pending}
              onClick={() => runFlag(() => markTaxDeductibleAction(txId, !isTaxDeductible))}
            />
          </div>
        </Section>

        {amountCents < 0 && !isTransfer && (
          <Section title="Convert">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              <MarkAsBnplDialog
                txId={txId}
                txDate={txDate}
                amountCents={amountCents}
                description={description}
              />
              {/* TASK 17: Mark as purchase trigger here */}
            </div>
          </Section>
        )}

        {warning && (
          <p role="status" style={{ fontSize: 11.5, color: "var(--warn)", margin: 0, lineHeight: 1.4 }}>
            {warning}
          </p>
        )}
        {error && (
          <p role="alert" style={{ fontSize: 11.5, color: "var(--expense)", margin: 0, lineHeight: 1.4 }}>
            {error}
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-3)" }}>
        {title}
      </span>
      {children}
    </div>
  );
}

function ChoiceButton({
  label,
  active,
  disabled,
  onClick,
  "aria-label": ariaLabel,
}: {
  label: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: "4px 9px",
        borderRadius: 7,
        fontSize: 12,
        fontWeight: 600,
        cursor: disabled ? "default" : "pointer",
        background: active ? "var(--coral-dim)" : "var(--surface-2)",
        color: active ? "var(--coral-text)" : "var(--text-2)",
        border: active
          ? "1px solid color-mix(in oklch, var(--coral) 34%, transparent)"
          : "1px solid var(--line)",
      }}
    >
      {label}
    </button>
  );
}
