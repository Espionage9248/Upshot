import type { AssetRepo, NewAsset } from "../ports";
import type { Asset, AssetValuation } from "@upshot/contracts";

export class FakeAssetRepo implements AssetRepo {
  private assets = new Map<string, Asset>();
  private valuations = new Map<string, AssetValuation[]>(); // keyed by assetId

  async list(): Promise<Asset[]> {
    return [...this.assets.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  async getById(id: string): Promise<Asset | null> {
    return this.assets.get(id) ?? null;
  }

  async create(input: NewAsset): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    this.assets.set(id, { ...input, id, createdAt: now, updatedAt: now, lastValuedAt: null });
    return id;
  }

  async update(input: Asset): Promise<void> {
    const now = new Date().toISOString();
    this.assets.set(input.id, { ...input, updatedAt: now });
  }

  async delete(id: string): Promise<void> {
    this.assets.delete(id);
    this.valuations.delete(id);
  }

  async recordValuation(assetId: string, valueCents: number, valuedAt: string): Promise<void> {
    const asset = this.assets.get(assetId);
    if (!asset) return;
    const id = crypto.randomUUID();
    const existing = this.valuations.get(assetId) ?? [];
    this.valuations.set(assetId, [...existing, { id, assetId, valueCents, valuedAt }]);
    const now = new Date().toISOString();
    this.assets.set(assetId, { ...asset, valueCents, lastValuedAt: valuedAt, updatedAt: now });
  }

  async listValuations(assetId: string): Promise<AssetValuation[]> {
    const rows = this.valuations.get(assetId) ?? [];
    return [...rows].sort((a, b) => a.valuedAt.localeCompare(b.valuedAt));
  }
}
