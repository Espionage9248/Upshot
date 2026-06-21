import { eq } from "drizzle-orm";
import type { DbClient } from "../client";
import { payoffPlan } from "../schema";

/** Row shape of the single payoff_plan row. */
export type PayoffPlanRow = typeof payoffPlan.$inferSelect;

const SINGLETON_ID = "default";

export class DrizzlePayoffPlanRepo {
  constructor(private readonly db: DbClient) {}

  async get(): Promise<PayoffPlanRow | null> {
    return (
      (this.db.select().from(payoffPlan).where(eq(payoffPlan.id, SINGLETON_ID)).get() as
        | PayoffPlanRow
        | undefined) ?? null
    );
  }

  async upsert(row: PayoffPlanRow): Promise<void> {
    const values = { ...row, id: SINGLETON_ID };
    this.db
      .insert(payoffPlan)
      .values(values)
      .onConflictDoUpdate({ target: payoffPlan.id, set: values })
      .run();
  }

  async delete(): Promise<void> {
    this.db.delete(payoffPlan).where(eq(payoffPlan.id, SINGLETON_ID)).run();
  }
}
