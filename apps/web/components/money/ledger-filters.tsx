"use client";

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input, UiSelect } from "@upshot/ui";

export interface FilterOption {
  value: string;
  label: string;
}

export interface LedgerFiltersProps {
  accountOptions: FilterOption[];
  categoryOptions: FilterOption[];
  tagOptions: FilterOption[];
}

/** Sentinel "no filter" value — Radix Select forbids an empty-string item value. */
const ALL = "__all__";

const FLAG_KEYS = ["salary", "transfer", "interest", "deductible"] as const;
type FlagKey = (typeof FLAG_KEYS)[number];
const FLAG_LABELS: Record<FlagKey, string> = {
  salary: "Salary",
  transfer: "Transfer",
  interest: "Interest",
  deductible: "Tax-deductible",
};

const STATUS_OPTIONS: FilterOption[] = [
  { value: ALL, label: "All statuses" },
  { value: "SETTLED", label: "Settled" },
  { value: "HELD", label: "Held" },
];

/**
 * Ledger filter controls. Client component (serializable props only — never
 * imports @upshot/db). Writes filter state into the URL search params via
 * router.replace; the RSC page re-runs loadLedger on the new searchParams.
 * Changing any filter resets pagination (drops the `page` param).
 */
export function LedgerFilters({ accountOptions, categoryOptions, tagOptions }: LedgerFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      if (value === null || value === "" || value === ALL) params.delete(key);
      else params.set(key, value);
      // Any filter change resets pagination.
      params.delete("page");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, searchParams],
  );

  const get = (key: string) => searchParams?.get(key) ?? undefined;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
      <div style={{ minWidth: 180, flex: "1 1 180px" }}>
        <Input
          placeholder="Search descriptions…"
          defaultValue={get("q") ?? ""}
          onChange={(e) => setParam("q", e.target.value)}
        />
      </div>

      <FilterSelect
        label="Account"
        value={get("account") ?? ALL}
        options={[{ value: ALL, label: "All accounts" }, ...accountOptions]}
        onChange={(v) => setParam("account", v)}
      />
      <FilterSelect
        label="Status"
        value={get("status") ?? ALL}
        options={STATUS_OPTIONS}
        onChange={(v) => setParam("status", v)}
      />
      <FilterSelect
        label="Category"
        value={get("category") ?? ALL}
        options={[{ value: ALL, label: "All categories" }, ...categoryOptions]}
        onChange={(v) => setParam("category", v)}
      />
      {tagOptions.length > 0 && (
        <FilterSelect
          label="Tag"
          value={get("tag") ?? ALL}
          options={[{ value: ALL, label: "All tags" }, ...tagOptions]}
          onChange={(v) => setParam("tag", v)}
        />
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        {FLAG_KEYS.map((key) => {
          const active = get(key) === "1";
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => setParam(key, active ? null : "1")}
              style={{
                padding: "0 12px",
                height: 34,
                borderRadius: "var(--radius-data)",
                fontSize: 12.5,
                fontWeight: 600,
                whiteSpace: "nowrap",
                cursor: "pointer",
                background: active ? "var(--coral-dim)" : "transparent",
                color: active ? "var(--coral-text)" : "var(--text-2)",
                border: active
                  ? "1px solid color-mix(in oklch, var(--coral) 34%, transparent)"
                  : "1px solid var(--line)",
              }}
            >
              {FLAG_LABELS[key]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}) {
  return (
    <div style={{ minWidth: 150 }}>
      <UiSelect label={label} value={value} options={options} onValueChange={onChange} />
    </div>
  );
}
