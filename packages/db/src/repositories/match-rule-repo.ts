import { asc, eq } from "drizzle-orm";
import type { MatchRuleRepo, LoadedRule } from "@upshot/core";
import type { DbClient } from "../client";
import { matchRules, matchConditions, matchActions } from "../schema";

export class DrizzleMatchRuleRepo implements MatchRuleRepo {
  constructor(private readonly db: DbClient) {}

  async loadActive(): Promise<LoadedRule[]> {
    const rules = this.db.select().from(matchRules)
      .where(eq(matchRules.isActive, true))
      .orderBy(asc(matchRules.priority)).all();
    return rules.map((rule) => ({
      rule,
      conditions: this.db.select().from(matchConditions).where(eq(matchConditions.ruleId, rule.id)).all(),
      actions: this.db.select().from(matchActions).where(eq(matchActions.ruleId, rule.id)).all(),
    }));
  }

  async loadAll(): Promise<LoadedRule[]> {
    const rules = this.db.select().from(matchRules)
      .orderBy(asc(matchRules.priority)).all();
    return rules.map((rule) => ({
      rule,
      conditions: this.db.select().from(matchConditions).where(eq(matchConditions.ruleId, rule.id)).all(),
      actions: this.db.select().from(matchActions).where(eq(matchActions.ruleId, rule.id)).all(),
    }));
  }

  async getById(id: string): Promise<LoadedRule | null> {
    const rule = this.db.select().from(matchRules).where(eq(matchRules.id, id)).get();
    if (!rule) return null;
    return {
      rule,
      conditions: this.db.select().from(matchConditions).where(eq(matchConditions.ruleId, id)).all(),
      actions: this.db.select().from(matchActions).where(eq(matchActions.ruleId, id)).all(),
    };
  }

  async create(input: LoadedRule): Promise<void> {
    return this.db.transaction((tx) => {
      tx.insert(matchRules).values(input.rule).run();
      if (input.conditions.length > 0) {
        tx.insert(matchConditions).values(input.conditions).run();
      }
      if (input.actions.length > 0) {
        tx.insert(matchActions).values(input.actions).run();
      }
    });
  }

  async update(input: LoadedRule): Promise<void> {
    return this.db.transaction((tx) => {
      tx.update(matchRules)
        .set({ name: input.rule.name, isActive: input.rule.isActive, priority: input.rule.priority })
        .where(eq(matchRules.id, input.rule.id))
        .run();
      tx.delete(matchConditions).where(eq(matchConditions.ruleId, input.rule.id)).run();
      tx.delete(matchActions).where(eq(matchActions.ruleId, input.rule.id)).run();
      if (input.conditions.length > 0) {
        tx.insert(matchConditions).values(input.conditions).run();
      }
      if (input.actions.length > 0) {
        tx.insert(matchActions).values(input.actions).run();
      }
    });
  }

  async delete(id: string): Promise<void> {
    this.db.delete(matchRules).where(eq(matchRules.id, id)).run();
  }
}
