import type { ReactNode } from "react";
import { Card, CardBody, CardHeader, CardTitle, Badge, Money, UiProgress, EmptyState } from "@upshot/ui";
import type { InstallmentsData, InstallmentRow } from "@/app/(app)/plan/installments/data";
import { InstallmentFormDialog } from "./installment-form-dialog";
import { InstallmentDeleteButton } from "./installment-delete-button";

function InstallmentCard({
  row,
  progress,
}: {
  row: InstallmentRow;
  progress: { remainingCents: number; percentComplete: number };
}): ReactNode {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{row.merchant}</CardTitle>
        <Badge tone="neutral">BNPL</Badge>
        <InstallmentDeleteButton id={row.id} />
      </CardHeader>
      <CardBody>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {/* Progress bar */}
          <div>
            <UiProgress
              value={progress.percentComplete}
              max={100}
              aria-label={`${row.merchant} ${progress.percentComplete}% paid`}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: "var(--text-3)",
                marginTop: 3,
              }}
            >
              <span>{progress.percentComplete}% paid</span>
              <span>
                {row.installmentsPaid} of {row.totalInstallments} installments
              </span>
            </div>
          </div>

          {/* Remaining amount */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>Remaining</span>
            <Money cents={progress.remainingCents} kind="expense" size={16} weight={700} />
          </div>

          {/* Per-installment and next due */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--text-3)" }}>
            <span>
              <Money cents={row.installmentCents} kind="neutral" size={11.5} />/installment
            </span>
            <span>
              Next due{" "}
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-2)" }}>
                {row.nextDueDate}
              </span>
            </span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function CompleteCard({ row }: { row: InstallmentRow }): ReactNode {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{row.merchant}</CardTitle>
        <Badge tone="saved">Paid off</Badge>
        <InstallmentDeleteButton id={row.id} />
      </CardHeader>
      <CardBody>
        <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>
          <Money cents={row.totalCents} kind="neutral" size={11.5} /> over {row.totalInstallments} installments
        </div>
      </CardBody>
    </Card>
  );
}

export function InstallmentList({ data }: { data: InstallmentsData }): ReactNode {
  const hasAny = data.active.length > 0 || data.complete.length > 0;

  return (
    <section aria-label="BNPL installments">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <InstallmentFormDialog />
      </div>
      {!hasAny ? (
        <EmptyState
          icon="card"
          title="No BNPL plans tracked"
          hint="Mark a purchase as BNPL to track your installment schedule."
          action={<InstallmentFormDialog />}
        />
      ) : (
        <>
          {data.active.length > 0 && (
            <div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: 12,
                }}
              >
                {data.active.map(({ row, progress }) => (
                  <InstallmentCard key={row.id} row={row} progress={progress} />
                ))}
              </div>
            </div>
          )}

          {data.complete.length > 0 && (
            <div style={{ marginTop: data.active.length > 0 ? 24 : 0 }}>
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
                Completed
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: 12,
                }}
              >
                {data.complete.map((row) => (
                  <CompleteCard key={row.id} row={row} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
