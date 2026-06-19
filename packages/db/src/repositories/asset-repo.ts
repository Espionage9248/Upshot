import { asc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { AssetRepo, NewAsset } from "@upshot/core";
import type { Asset, AssetValuation } from "@upshot/contracts";
import type { DbClient } from "../client";
import { assets, assetValuations } from "../schema";

export class DrizzleAssetRepo implements AssetRepo {
  constructor(private readonly db: DbClient) {}

  async list(): Promise<Asset[]> {
    return this.db.select().from(assets).orderBy(asc(assets.name)).all() as Asset[];
  }

  async getById(id: string): Promise<Asset | null> {
    return (this.db.select().from(assets).where(eq(assets.id, id)).get() as Asset | undefined) ?? null;
  }

  async create(input: NewAsset): Promise<string> {
    const id = randomUUID();
    const now = new Date().toISOString();
    this.db.insert(assets).values({
      id,
      name: input.name,
      type: input.type,
      valueCents: input.valueCents,
      institution: input.institution ?? null,
      notes: input.notes ?? null,
      includeInNetWorth: input.includeInNetWorth,
      lastValuedAt: null,
      createdAt: now,
      updatedAt: now,
    }).run();
    return id;
  }

  async update(input: Asset): Promise<void> {
    const now = new Date().toISOString();
    this.db.update(assets).set({
      name: input.name,
      type: input.type,
      valueCents: input.valueCents,
      institution: input.institution ?? null,
      notes: input.notes ?? null,
      includeInNetWorth: input.includeInNetWorth,
      lastValuedAt: input.lastValuedAt ?? null,
      updatedAt: now,
    }).where(eq(assets.id, input.id)).run();
  }

  async delete(id: string): Promise<void> {
    this.db.delete(assets).where(eq(assets.id, id)).run();
  }

  async recordValuation(assetId: string, valueCents: number, valuedAt: string): Promise<void> {
    return this.db.transaction((tx) => {
      tx.insert(assetValuations).values({
        id: randomUUID(),
        assetId,
        valueCents,
        valuedAt,
      }).run();
      tx.update(assets).set({ valueCents, lastValuedAt: valuedAt, updatedAt: new Date().toISOString() }).where(eq(assets.id, assetId)).run();
    });
  }

  async listValuations(assetId: string): Promise<AssetValuation[]> {
    return this.db.select().from(assetValuations)
      .where(eq(assetValuations.assetId, assetId))
      .orderBy(asc(assetValuations.valuedAt))
      .all() as AssetValuation[];
  }
}
