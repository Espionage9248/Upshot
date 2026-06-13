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
}
