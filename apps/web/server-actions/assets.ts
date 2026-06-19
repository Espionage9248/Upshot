"use server";

/**
 * Asset Server Actions (auth-guarded wrappers). Local-only — assets are NOT
 * synced to Up. No UpClient is constructed here.
 *
 * Security invariants (single-user app — non-negotiable):
 *   - Every action re-checks the session server-side via action(), which
 *     short-circuits an unauthenticated call before any DB access and returns a
 *     safe ActionResult.
 *
 * The actual persistence + event_log logic is in `assets-core.ts` (pure,
 * db-injected). These wrappers stay thin so the action() result-contract
 * wraps them cleanly (a "use server" module may export only async functions +
 * `export type` re-exports).
 */

import { action } from "@/lib/action";
import { getDb } from "@/lib/db";
import { createAsset, updateAsset, deleteAsset, recordValuation } from "./assets-core";
import type { NewAsset } from "@upshot/core";
import type { Asset } from "./assets-core";

export type { Asset } from "./assets-core";

/** Action: create a new asset. Returns the new asset id. */
export const createAssetAction = action(async (_session, input: NewAsset) => {
  const { db } = getDb();
  return createAsset(db, input);
});

/** Action: update an existing asset. */
export const updateAssetAction = action(async (_session, asset: Asset) => {
  const { db } = getDb();
  await updateAsset(db, asset);
});

/** Action: delete an asset (cascade removes its valuations). */
export const deleteAssetAction = action(async (_session, id: string) => {
  const { db } = getDb();
  await deleteAsset(db, id);
});

/** Action: append a valuation and bump the asset's current value. */
export const recordValuationAction = action(
  async (_session, assetId: string, valueCents: number, valuedAt: string) => {
    const { db } = getDb();
    await recordValuation(db, assetId, valueCents, valuedAt);
  },
);
