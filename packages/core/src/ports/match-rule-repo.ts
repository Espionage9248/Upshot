import type { MatchRule, MatchCondition, MatchAction } from "@upshot/contracts";

export interface LoadedRule {
  rule: MatchRule;
  conditions: MatchCondition[];
  actions: MatchAction[];
}

export interface MatchRuleRepo {
  /** Active rules with their conditions + actions, ascending by priority. */
  loadActive(): Promise<LoadedRule[]>;
  /** All rules (active + inactive), ascending by priority. */
  loadAll(): Promise<LoadedRule[]>;
  /** Single rule by id, or null if not found. */
  getById(id: string): Promise<LoadedRule | null>;
  /** Insert the rule + its conditions + actions, transactional. */
  create(input: LoadedRule): Promise<void>;
  /** Replace conditions/actions for the rule, transactional. */
  update(input: LoadedRule): Promise<void>;
  /** Delete the rule row (cascade removes children). */
  delete(id: string): Promise<void>;
}
