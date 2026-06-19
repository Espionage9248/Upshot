/**
 * Pure asset CRUD + valuation persistence (db-injected). Local-only — assets
 * are NOT synced to Up. There is no UpClient here.
 *
 * Kept out of the "use server" module so these helpers are NOT registered as
 * client-callable Server Actions. The thin auth-guarded wrappers live in
 * `assets.ts` (same split as money-core.ts / money.ts).
 */

import { randomUUID } from "node:crypto";
import { DrizzleAssetRepo, tables, type DbClient } from "@upshot/db";
import type { NewAsset } from "@upshot/core";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** An asset row as returned by the repo (derived — avoids importing @upshot/contracts). */
type Asset = Awaited<ReturnType<DrizzleAssetRepo["list"]>>[number];

// Re-export so the thin wrapper can use it without importing contracts.
export type { Asset };

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Append an event_log entry. createdAt defaults in-schema. */
function logEvent(
  db: DbClient,
  action: string,
  entityType: string,
  entityId: string,
  description: string,
  meta: Record<string, unknown>,
): void {
  db.insert(tables.eventLog)
    .values({
      id: randomUUID(),
      category: "asset",
      action,
      entityType,
      entityId,
      description,
      meta,
    })
    .run();
}

// ---------------------------------------------------------------------------
// createAsset
// ---------------------------------------------------------------------------

/** Create a new asset. Returns the new asset id. */
export async function createAsset(db: DbClient, input: NewAsset): Promise<string> {
  const id = await new DrizzleAssetRepo(db).create(input);
  logEvent(db, "create_asset", "asset", id, `Created asset: ${input.name}`, { name: input.name });
  return id;
}

// ---------------------------------------------------------------------------
// updateAsset
// ---------------------------------------------------------------------------

/** Update an existing asset. */
export async function updateAsset(db: DbClient, asset: Asset): Promise<void> {
  await new DrizzleAssetRepo(db).update(asset);
  logEvent(db, "update_asset", "asset", asset.id, `Updated asset: ${asset.name}`, {
    name: asset.name,
  });
}

// ---------------------------------------------------------------------------
// deleteAsset
// ---------------------------------------------------------------------------

/** Delete an asset (cascade removes its valuations). */
export async function deleteAsset(db: DbClient, id: string): Promise<void> {
  await new DrizzleAssetRepo(db).delete(id);
  logEvent(db, "delete_asset", "asset", id, `Deleted asset: ${id}`, {});
}

// ---------------------------------------------------------------------------
// recordValuation
// ---------------------------------------------------------------------------

/** Append a valuation row and bump the asset's valueCents + lastValuedAt. */
export async function recordValuation(
  db: DbClient,
  assetId: string,
  valueCents: number,
  valuedAt: string,
): Promise<void> {
  await new DrizzleAssetRepo(db).recordValuation(assetId, valueCents, valuedAt);
  logEvent(db, "record_valuation", "asset", assetId, `Recorded valuation for asset: ${assetId}`, {
    valueCents,
    valuedAt,
  });
}
