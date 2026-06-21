import type { ReactNode } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Money,
  Alert,
  EmptyState,
} from "@upshot/ui";
import { toMonthlyCostCents } from "@upshot/core";
import type { RecurringData, RecurringRow } from "@/app/(app)/plan/recurring/data";
import { RecurringSuggestionCard } from "./recurring-suggestion-card";
import { RecurringKindToggle } from "./recurring-kind-toggle";
import { RecurringDeleteButton } from "./recurring-delete-button";

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

function SectionLabel({ children }: { children: ReactNode }): ReactNode {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: "var(--text-3)",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Active/Paused item card
// ---------------------------------------------------------------------------

function RecurringItemCard({
  row,
}: {
  row: RecurringRow;
}): ReactNode {
  const monthlyCents = toMonthlyCostCents(row.amountCents, row.frequency);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{row.name}</CardTitle>
        <RecurringKindToggle id={row.id} kind={row.kind} />
        <RecurringDeleteButton id={row.id} />
      </CardHeader>
      <CardBody>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {row.category && (
            <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{row.category}</span>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>
              {row.frequency.charAt(0) + row.frequency.slice(1).toLowerCase()}
            </span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
              <Money cents={row.amountCents} kind="expense" size={15} weight={700} />
              {row.frequency !== "MONTHLY" && (
                <span style={{ fontSize: 10.5, color: "var(--text-3)" }}>
                  <Money cents={monthlyCents} kind="neutral" size={10.5} />/mo
                </span>
              )}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Grid layout
// ---------------------------------------------------------------------------

function CardGrid({ children }: { children: ReactNode }): ReactNode {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 12,
      }}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main exported component
// ---------------------------------------------------------------------------

export function RecurringList({ data }: { data: RecurringData }): ReactNode {
  const hasAny =
    data.active.length > 0 || data.paused.length > 0 || data.suggested.length > 0;

  const nameById = new Map(
    [...data.active, ...data.paused].map((r) => [r.id, r.name]),
  );

  return (
    <section aria-label="Recurring charges">
      {/* Monthly total summary */}
      {data.active.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 16,
            padding: "10px 14px",
            borderRadius: "var(--radius-data)",
            background: "var(--surface-2)",
          }}
        >
          <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Monthly total
          </span>
          <Money cents={data.monthlyTotalCents} kind="expense" size={16} weight={700} />
        </div>
      )}

      {/* Drift alerts */}
      {data.driftAlerts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {data.driftAlerts.map((alert) => (
            <Alert key={alert.id} tone="warning">
              <strong>{alert.name}</strong> price changed from{" "}
              <Money cents={alert.previousAmountCents} kind="neutral" size={12.5} /> to{" "}
              <Money cents={alert.amountCents} kind="expense" size={12.5} />.
            </Alert>
          ))}
        </div>
      )}

      {/* Overlap warnings */}
      {data.overlaps.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {data.overlaps.map((group) => {
            const label = group.groupKey.startsWith("category:")
              ? `category "${group.groupKey.slice("category:".length)}"`
              : `merchant "${group.groupKey.slice("merchant:".length)}"`;
            return (
              <Alert key={group.groupKey} tone="info">
                These share {label}:{" "}
                {group.itemIds.map((id, i) => (
                  <span key={id}>
                    <a href={`#recurring-${id}`}>{nameById.get(id) ?? id}</a>
                    {i < group.itemIds.length - 1 ? ", " : ""}
                  </span>
                ))}{" "}
                — possible duplicate.
              </Alert>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!hasAny && (
        <EmptyState
          icon="bell"
          title="No recurring charges tracked"
          hint="Recurring charges detected from your transactions will appear here for review."
        />
      )}

      {/* Suggested */}
      {data.suggested.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>Suggested</SectionLabel>
          <CardGrid>
            {data.suggested.map((row) => (
              <RecurringSuggestionCard key={row.id} row={row} />
            ))}
          </CardGrid>
        </div>
      )}

      {/* Active */}
      {data.active.length > 0 && (
        <div style={{ marginBottom: data.paused.length > 0 ? 24 : 0 }}>
          <SectionLabel>Active</SectionLabel>
          <CardGrid>
            {data.active.map((row) => (
              <div key={row.id} id={`recurring-${row.id}`}>
                <RecurringItemCard row={row} />
              </div>
            ))}
          </CardGrid>
        </div>
      )}

      {/* Paused */}
      {data.paused.length > 0 && (
        <div>
          <SectionLabel>Paused</SectionLabel>
          <CardGrid>
            {data.paused.map((row) => (
              <div key={row.id} id={`recurring-${row.id}`}>
                <RecurringItemCard row={row} />
              </div>
            ))}
          </CardGrid>
        </div>
      )}
    </section>
  );
}
