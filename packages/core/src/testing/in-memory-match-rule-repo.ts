import type { LoadedRule, MatchRuleRepo } from "../ports/match-rule-repo";

export class InMemoryMatchRuleRepo implements MatchRuleRepo {
  constructor(private readonly rules: LoadedRule[] = []) {}

  async loadActive(): Promise<LoadedRule[]> {
    return this.rules
      .filter((r) => r.rule.isActive)
      .slice()
      .sort((a, b) => a.rule.priority - b.rule.priority);
  }
}
