import type { Asset, AssetValuation } from "@upshot/contracts";

/** New-asset input: store-assigned fields are omitted. */
export type NewAsset = Omit<Asset, "id" | "createdAt" | "updatedAt" | "lastValuedAt">;

export interface AssetRepo {
  list(): Promise<Asset[]>;
  getById(id: string): Promise<Asset | null>;
  create(input: NewAsset): Promise<string>; // returns id
  update(input: Asset): Promise<void>;
  delete(id: string): Promise<void>; // asset_valuations cascade
  recordValuation(assetId: string, valueCents: number, valuedAt: string): Promise<void>;
  listValuations(assetId: string): Promise<AssetValuation[]>;
}
