import type { MatchRule, MatchCondition, MatchAction } from "@upshot/contracts";

export interface LoadedRule {
  rule: MatchRule;
  conditions: MatchCondition[];
  actions: MatchAction[];
}

export interface MatchRuleRepo {
  /** Active rules with their conditions + actions, ascending by priority. */
  loadActive(): Promise<LoadedRule[]>;
}
