import { DrizzlePurchaseRepo, type DbClient } from "@upshot/db";
import { monthlySaveTarget } from "@upshot/core";

/** Purchase row as returned by the repo — avoids a direct @upshot/contracts dep in apps/web. */
export type PurchaseRow = Awaited<ReturnType<DrizzlePurchaseRepo["list"]>>[number];

export interface PurchasesData {
  wishlist: (PurchaseRow & { saveMonthlyCents: number | null })[];
  purchased: PurchaseRow[];
}

/**
 * Server-only loader for the Purchases surface. Reads the encrypted DB in-process
 * via injected `db`. Returns domain data only — no @upshot/contracts import.
 */
export async function loadPurchasesData(
  db: DbClient,
  now: Date = new Date(),
): Promise<PurchasesData> {
  const rows = await new DrizzlePurchaseRepo(db).list();

  const wishlist = rows
    .filter((row) => row.status === "WISHLIST")
    .map((row) => ({
      ...row,
      saveMonthlyCents: monthlySaveTarget(
        row.targetPriceCents ?? 0,
        row.targetDate ?? null,
        now,
      ).monthlyCents,
    }));

  const purchased = rows.filter((row) => row.status === "PURCHASED");

  return { wishlist, purchased };
}
