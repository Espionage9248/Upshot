import type { ReactNode } from "react";
import { Card, CardBody, CardHeader, CardTitle, EmptyState } from "@upshot/ui";
import type { BudgetData } from "@/app/(app)/budget/data";
import { SaverCard } from "./saver-card";
import { EmergencyFundCard } from "./emergency-fund-card";
import { AllocateDialog } from "./allocate-dialog";
import { TransferDialog } from "./transfer-dialog";

const GAP = 16;

function Row({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: GAP,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Presentational Budget board. Data arrives via props (no DB/auth/hooks). Lays
 * out the savers grid (each with allocate/transfer dialogs) and the
 * emergency-fund readiness card. Empty state when there are no savers yet.
 */
export function BudgetBoard({ data }: { data: BudgetData }): ReactNode {
  const { savers, emergencyFund, month } = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 18 }}>
      {emergencyFund && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 360px)", gap: GAP }}>
          <EmergencyFundCard fund={emergencyFund} />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Savers</CardTitle>
        </CardHeader>
        <CardBody>
          {savers.length === 0 ? (
            <EmptyState
              icon="plan"
              title="No savers yet"
              hint="Saver accounts synced from Up appear here as budget envelopes."
            />
          ) : (
            <Row>
              {savers.map((saver) => (
                <div key={saver.id} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <SaverCard saver={saver} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <AllocateDialog
                      accountId={saver.id}
                      accountName={saver.name}
                      month={month}
                      currentCents={saver.analysis.monthlyAllocation}
                    />
                    <TransferDialog
                      month={month}
                      fromAccountId={saver.id}
                      fromAccountName={saver.name}
                      destinations={[
                        ...savers.filter((s) => s.id !== saver.id).map((s) => ({ id: s.id, name: s.name })),
                        ...(emergencyFund
                          ? [{ id: emergencyFund.accountId, name: emergencyFund.accountName }]
                          : []),
                      ]}
                    />
                  </div>
                </div>
              ))}
            </Row>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
