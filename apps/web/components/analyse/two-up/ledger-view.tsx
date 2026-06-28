"use client";

import { useState, type ReactElement } from "react";
import Link from "next/link";
import { FilterChip } from "@upshot/ui";
import { filterLedger, type TwoUpTxn, type LedgerFilter } from "@upshot/core";
import { TUpRow } from "./tup-row";

const PERSON_OPTIONS = [
  { value: "JAMES", label: "James" },
  { value: "BRITTNEY", label: "Britt" },
  { value: "SHARED", label: "Shared" },
  { value: "UNASSIGNED", label: "Unassigned" },
];

const DIRECTION_OPTIONS = [
  { value: "IN", label: "Money in" },
  { value: "OUT", label: "Money out" },
];

export function LedgerView({ txns }: { txns: TwoUpTxn[] }): ReactElement {
  const [search, setSearch] = useState("");
  const [person, setPerson] = useState<string | undefined>(undefined);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [direction, setDirection] = useState<string | undefined>(undefined);

  // Derive unique categories from the full txn list for the chip options.
  const categoryOptions = Array.from(
    new Set(txns.map((t) => t.category).filter((c): c is string => c !== null)),
  )
    .sort()
    .map((c) => ({ value: c, label: c }));

  // Build filter — only set keys that have a real selection so filterLedger
  // doesn't over-filter. Empty search string is falsy, so it isn't passed.
  const f: LedgerFilter = {};
  if (search) f.search = search;
  if (person) f.owner = person as LedgerFilter["owner"];
  if (category) f.category = category;
  if (direction) f.direction = direction as LedgerFilter["direction"];

  const visible = filterLedger(txns, f);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* ── Toolbar ── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
        }}
      >
        {/* Search input */}
        <input
          type="search"
          aria-label="Search transactions"
          placeholder="Search transactions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            height: 34,
            padding: "0 12px",
            borderRadius: "var(--radius-data)",
            border: "1px solid var(--line)",
            background: "transparent",
            color: "var(--text)",
            fontSize: 13,
            outline: "none",
            minWidth: 200,
          }}
        />

        {/* Person filter */}
        <FilterChip
          label="Person"
          options={PERSON_OPTIONS}
          value={person}
          onValueChange={(v) => setPerson(person === v ? undefined : v)}
        />

        {/* Category filter */}
        {categoryOptions.length > 0 && (
          <FilterChip
            label="Category"
            options={categoryOptions}
            value={category}
            onValueChange={(v) => setCategory(category === v ? undefined : v)}
          />
        )}

        {/* Direction filter */}
        <FilterChip
          label="Direction"
          options={DIRECTION_OPTIONS}
          value={direction}
          onValueChange={(v) => setDirection(direction === v ? undefined : v)}
        />

        {/* Result count */}
        <span
          style={{
            marginLeft: "auto",
            fontSize: 12,
            color: "var(--text-3)",
            fontWeight: 600,
          }}
        >
          {visible.length} transaction{visible.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Ledger rows ── */}
      <div
        style={{
          border: "1px solid var(--line-soft)",
          borderRadius: "var(--radius-card)",
          overflow: "hidden",
        }}
      >
        {visible.length === 0 ? (
          <div
            style={{
              padding: "32px 18px",
              textAlign: "center",
              fontSize: 13.5,
              color: "var(--text-3)",
            }}
          >
            No transactions match the current filters.
          </div>
        ) : (
          visible.map((txn) => <TUpRow key={txn.id} txn={txn} />)
        )}
      </div>

      {/* ── Back link ── */}
      <div style={{ marginTop: 4 }}>
        <Link
          href="/analyse/2up"
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: "var(--coral)",
            textDecoration: "none",
          }}
        >
          ← Back to overview
        </Link>
      </div>
    </div>
  );
}
