import { eq } from "drizzle-orm";
import type { TwoUpTxn, Owner } from "@upshot/core";
import type { DbClient } from "../client";
import { twoUpTransactions } from "../schema";

function toOwner(contributor: string | null): Owner {
  return (contributor ?? "UNASSIGNED") as Owner;
}

export class DrizzleTwoUpRepo {
  constructor(private readonly db: DbClient) {}

  list(): TwoUpTxn[] {
    return this.db.select().from(twoUpTransactions).all().map((r) => ({
      id: r.id, rowHash: r.rowHash, date: r.date, description: r.description,
      amountCents: r.amountCents, owner: toOwner(r.contributor), category: r.category,
    }));
  }

  upsertMany(rows: TwoUpTxn[]): number {
    let inserted = 0;
    for (const r of rows) {
      const res = this.db.insert(twoUpTransactions).values({
        id: r.id, rowHash: r.rowHash, date: r.date, description: r.description,
        amountCents: r.amountCents, contributor: r.owner, category: r.category,
      }).onConflictDoNothing({ target: twoUpTransactions.rowHash }).run();
      inserted += res.changes;
    }
    return inserted;
  }

  updateAttribution(id: string, patch: { owner?: Owner; category?: string | null }): void {
    const set: Record<string, unknown> = {};
    if (patch.owner !== undefined) set.contributor = patch.owner;
    if (patch.category !== undefined) set.category = patch.category;
    if (Object.keys(set).length === 0) return;
    this.db.update(twoUpTransactions).set(set).where(eq(twoUpTransactions.id, id)).run();
  }
}
