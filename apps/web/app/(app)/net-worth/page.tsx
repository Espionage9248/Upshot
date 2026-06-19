import type { ReactNode } from "react";
import { Card, CardHeader, CardTitle, CardBody, type UiSelectOption } from "@upshot/ui";
import { TopBar } from "@/components/top-bar";
import { getDb } from "@/lib/db";
import { NetWorthSummary } from "@/components/net-worth/net-worth-summary";
import { NetWorthTrend } from "@/components/net-worth/net-worth-trend";
import { AssetForm } from "@/components/net-worth/asset-form";
import { AssetList } from "@/components/net-worth/asset-list";
import { loadNetWorthData } from "./data";

// The DB client is constructed from env at request time, so this route must
// never be statically prerendered (mirrors money/page.tsx, today/page.tsx).
export const dynamic = "force-dynamic";

// Asset type options for the form. Re-declared locally — apps/web must not
// import @upshot/contracts (keeps the client bundle free of the schema dep).
const ASSET_TYPE_VALUES = ["INVESTMENT", "SUPER", "PROPERTY", "VEHICLE", "CASH", "OTHER"] as const;
const ASSET_TYPE_LABELS: Record<(typeof ASSET_TYPE_VALUES)[number], string> = {
  INVESTMENT: "Investment",
  SUPER: "Super",
  PROPERTY: "Property",
  VEHICLE: "Vehicle",
  CASH: "Cash",
  OTHER: "Other",
};
const TYPE_OPTIONS: UiSelectOption[] = ASSET_TYPE_VALUES.map((v) => ({
  value: v,
  label: ASSET_TYPE_LABELS[v],
}));

export default async function NetWorthPage(): Promise<ReactNode> {
  const { db } = getDb();
  const data = await loadNetWorthData(db);

  return (
    <>
      <TopBar title="Net worth" sub="ASSETS − DEBTS · UPDATED" />
      <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 18 }}>
        <Card>
          <CardHeader>
            <CardTitle>Total net worth</CardTitle>
          </CardHeader>
          <CardBody>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <NetWorthSummary totalCents={data.totalCents} />
              <NetWorthTrend series={data.trend} />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assets</CardTitle>
            <AssetForm mode="create" typeOptions={TYPE_OPTIONS} />
          </CardHeader>
          <CardBody>
            <AssetList assets={data.assets} typeOptions={TYPE_OPTIONS} />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
