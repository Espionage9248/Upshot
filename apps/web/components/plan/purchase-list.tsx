import type { ReactNode } from "react";
import { Card, CardBody, CardHeader, CardTitle, Badge, Money, EmptyState } from "@upshot/ui";
import type { PurchasesData, PurchaseRow } from "@/app/(app)/plan/purchases/data";
import { PurchaseFormDialog } from "./purchase-form-dialog";
import { PurchaseDeleteButton } from "./purchase-delete-button";

function WishlistCard({
  row,
}: {
  row: PurchaseRow & { saveMonthlyCents: number | null };
}): ReactNode {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{row.customName ?? "Unnamed"}</CardTitle>
        {row.priority != null && (
          <Badge tone="neutral">Priority {row.priority}</Badge>
        )}
      </CardHeader>
      <CardBody>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {row.targetPriceCents != null && (
            <Money cents={row.targetPriceCents} kind="neutral" size={18} weight={700} />
          )}
          {row.saveMonthlyCents != null && (
            <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>
              Save{" "}
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-2)" }}>
                <Money cents={row.saveMonthlyCents} kind="neutral" size={11.5} />
              </span>
              /mo
            </div>
          )}
          {row.url && (
            <a
              href={row.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 11.5, color: "var(--text-3)", wordBreak: "break-all" }}
            >
              {row.url}
            </a>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <PurchaseDeleteButton id={row.id} />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export function PurchaseList({ data }: { data: PurchasesData }): ReactNode {
  return (
    <section aria-label="Purchases">
      {/* Wishlist */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-3)", margin: 0 }}>
            Wishlist
          </h2>
          <PurchaseFormDialog />
        </div>
        {data.wishlist.length === 0 ? (
          <EmptyState
            icon="card"
            title="Nothing on your wishlist"
            hint="Add something you want to buy and set a target price for a save-rate hint."
            action={<PurchaseFormDialog />}
          />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 12,
            }}
          >
            {data.wishlist.map((row) => (
              <WishlistCard key={row.id} row={row} />
            ))}
          </div>
        )}
      </div>

      {/* Purchased */}
      {data.purchased.length > 0 && (
        <div>
          <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-3)", margin: "0 0 12px 0" }}>
            Purchased
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 12,
            }}
          >
            {data.purchased.map((row) => (
              <Card key={row.id}>
                <CardHeader>
                  <CardTitle>{row.customName ?? "Unnamed"}</CardTitle>
                </CardHeader>
                {row.priceCents != null && (
                  <CardBody>
                    <Money cents={row.priceCents} kind="neutral" size={16} weight={600} />
                  </CardBody>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
