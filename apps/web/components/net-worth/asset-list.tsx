"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  Badge,
  Money,
  Button,
  EmptyState,
  type UiSelectOption,
} from "@upshot/ui";
import { deleteAssetAction } from "@/server-actions/assets";
import { AssetForm } from "./asset-form";
import type { AssetRow } from "@/app/(app)/net-worth/data";

export interface AssetListProps {
  assets: AssetRow[];
  typeOptions: UiSelectOption[];
}

const TYPE_LABEL: Record<string, string> = {
  INVESTMENT: "Investment",
  SUPER: "Super",
  PROPERTY: "Property",
  VEHICLE: "Vehicle",
  CASH: "Cash",
  OTHER: "Other",
};

/**
 * Asset table for /net-worth: name + type Badge + value (mono) + include flag,
 * each row editing (AssetForm in update mode) and deleting (deleteAssetAction).
 * Client component — serializable props only, never imports @upshot/db. Handles
 * the delete ActionResult and refreshes on success.
 */
export function AssetList({ assets, typeOptions }: AssetListProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onDelete(id: string) {
    startTransition(async () => {
      const res = await deleteAssetAction(id);
      if (res.ok) router.refresh();
    });
  }

  if (assets.length === 0) {
    return (
      <EmptyState
        icon="scale"
        title="No assets yet"
        hint="Add property, super, investments or vehicles to track your net worth."
      />
    );
  }

  return (
    <Table>
      <THead>
        <TR>
          <TH>Asset</TH>
          <TH>Type</TH>
          <TH numeric>Value</TH>
          <TH numeric>In net worth</TH>
          <TH numeric>Actions</TH>
        </TR>
      </THead>
      <TBody>
        {assets.map((a) => (
          <TR key={a.id}>
            <TD>
              <div style={{ fontWeight: 600 }}>{a.name}</div>
              {a.institution && (
                <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>
                  {a.institution}
                </div>
              )}
            </TD>
            <TD>
              <Badge tone="neutral">{TYPE_LABEL[a.type] ?? a.type}</Badge>
            </TD>
            <TD numeric>
              <Money cents={a.valueCents} kind="neutral" size={14} weight={600} />
            </TD>
            <TD numeric>
              <span style={{ fontSize: 12, color: a.includeInNetWorth ? "var(--income)" : "var(--text-3)" }}>
                {a.includeInNetWorth ? "Yes" : "No"}
              </span>
            </TD>
            <TD numeric>
              <div style={{ display: "inline-flex", gap: 8, justifyContent: "flex-end" }}>
                <AssetForm mode="update" typeOptions={typeOptions} asset={a} />
                <Button
                  variant="danger"
                  size="sm"
                  aria-label={`Delete ${a.name}`}
                  disabled={pending}
                  onClick={() => onDelete(a.id)}
                >
                  Delete
                </Button>
              </div>
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
