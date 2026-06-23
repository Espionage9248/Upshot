import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { DbClient } from "../client";
import { purchases } from "../schema";

export type Purchase = typeof purchases.$inferSelect;
export type NewPurchase = Partial<Omit<Purchase, "status">> & { status: string; currency?: string };

export class DrizzlePurchaseRepo {
  constructor(private readonly db: DbClient) {}

  async list(): Promise<Purchase[]> {
    return this.db.select().from(purchases).all() as Purchase[];
  }

  async listByStatus(status: string): Promise<Purchase[]> {
    return this.db.select().from(purchases).where(eq(purchases.status, status as Purchase["status"])).all() as Purchase[];
  }

  async getById(id: string): Promise<Purchase | null> {
    return (this.db.select().from(purchases).where(eq(purchases.id, id)).get() as Purchase | undefined) ?? null;
  }

  async create(input: NewPurchase): Promise<string> {
    const id = (input as { id?: string }).id ?? randomUUID();
    this.db.insert(purchases).values({
      id,
      customName: input.customName ?? null,
      status: input.status as Purchase["status"],
      transactionId: input.transactionId ?? null,
      priceCents: input.priceCents ?? null,
      currency: input.currency ?? "AUD",
      merchant: input.merchant ?? null,
      category: input.category ?? null,
      purchaseDate: input.purchaseDate ?? null,
      targetDate: input.targetDate ?? null,
      targetPriceCents: input.targetPriceCents ?? null,
      priority: input.priority ?? null,
      url: input.url ?? null,
      notes: input.notes ?? null,
    }).run();
    return id;
  }

  async update(input: Purchase): Promise<void> {
    this.db.update(purchases).set({
      customName: input.customName,
      status: input.status,
      transactionId: input.transactionId,
      priceCents: input.priceCents,
      currency: input.currency,
      merchant: input.merchant,
      category: input.category,
      purchaseDate: input.purchaseDate,
      targetDate: input.targetDate,
      targetPriceCents: input.targetPriceCents,
      priority: input.priority,
      url: input.url,
      notes: input.notes,
    }).where(eq(purchases.id, input.id)).run();
  }

  async setStatus(
    id: string,
    status: string,
    fields?: { transactionId?: string; priceCents?: number; purchaseDate?: string },
  ): Promise<void> {
    this.db.update(purchases).set({
      status: status as Purchase["status"],
      ...(fields?.transactionId !== undefined && { transactionId: fields.transactionId }),
      ...(fields?.priceCents !== undefined && { priceCents: fields.priceCents }),
      ...(fields?.purchaseDate !== undefined && { purchaseDate: fields.purchaseDate }),
    }).where(eq(purchases.id, id)).run();
  }

  async delete(id: string): Promise<void> {
    this.db.delete(purchases).where(eq(purchases.id, id)).run();
  }
}
