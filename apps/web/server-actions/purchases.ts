"use server";

/**
 * Purchases Server Actions (auth-guarded wrappers).
 *
 * Security invariants:
 *   - Every action re-checks the session server-side via action(), which
 *     short-circuits an unauthenticated call before any DB access.
 *
 * A "use server" module may export only async functions + `export type` re-exports
 * with `from` (never bare `export type { X };`).
 */

import { revalidatePath } from "next/cache";
import { action } from "@/lib/action";
import { getDb } from "@/lib/db";
import { DrizzlePurchaseRepo } from "@upshot/db";
import { parsePurchaseMeta } from "./purchases-core";
import type { PurchaseRow } from "../app/(app)/plan/purchases/data";

export type { PurchaseRow } from "../app/(app)/plan/purchases/data";

/** Input for creating a wishlist item. */
export type CreatePurchaseInput = {
  customName?: string;
  targetPriceCents?: number;
  targetDate?: string | null;
  priority?: number | null;
  url?: string | null;
  notes?: string | null;
};

/** Action: create a wishlist item. Returns the new purchase id. */
export const createPurchaseAction = action(
  async (_session, input: CreatePurchaseInput): Promise<string> => {
    const { db } = getDb();
    const repo = new DrizzlePurchaseRepo(db);
    const id = await repo.create({
      status: "WISHLIST",
      customName: input.customName ?? null,
      targetPriceCents: input.targetPriceCents ?? null,
      targetDate: input.targetDate ?? null,
      priority: input.priority ?? null,
      url: input.url ?? null,
      notes: input.notes ?? null,
      currency: "AUD",
    });
    revalidatePath("/plan/purchases");
    revalidatePath("/plan");
    return id;
  },
);

/** Action: update an existing purchase/wishlist item. */
export const updatePurchaseAction = action(
  async (_session, input: PurchaseRow): Promise<void> => {
    const { db } = getDb();
    const repo = new DrizzlePurchaseRepo(db);
    await repo.update(input);
    revalidatePath("/plan/purchases");
    revalidatePath("/plan");
  },
);

/** Action: delete a purchase/wishlist item. */
export const deletePurchaseAction = action(
  async (_session, id: string): Promise<void> => {
    const { db } = getDb();
    const repo = new DrizzlePurchaseRepo(db);
    await repo.delete(id);
    revalidatePath("/plan/purchases");
    revalidatePath("/plan");
  },
);

/** Action: mark a transaction as a completed purchase. */
export const markPurchaseFromTransactionAction = action(
  async (
    _session,
    input: {
      transactionId: string;
      customName?: string | null;
      priceCents: number;
      purchaseDate: string;
    },
  ): Promise<string> => {
    const { db } = getDb();
    const repo = new DrizzlePurchaseRepo(db);
    const id = await repo.create({
      status: "PURCHASED",
      transactionId: input.transactionId,
      customName: input.customName ?? null,
      priceCents: input.priceCents,
      purchaseDate: input.purchaseDate,
      currency: "AUD",
    });
    revalidatePath("/plan/purchases");
    revalidatePath("/plan");
    return id;
  },
);

/** Action: scrape Open Graph metadata from a URL for purchase pre-fill. */
export const scrapePurchaseUrlAction = action(
  async (
    _session,
    url: string,
  ): Promise<{ name?: string; priceCents?: number; merchant?: string }> => {
    const res = await fetch(url);
    if (!res.ok) return {};
    const html = await res.text();
    return parsePurchaseMeta(html);
  },
);
