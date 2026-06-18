import type { LoadedRule, MatchRuleRepo } from "../ports/match-rule-repo";

export class InMemoryMatchRuleRepo implements MatchRuleRepo {
  constructor(private readonly rules: LoadedRule[] = []) {}

  async loadActive(): Promise<LoadedRule[]> {
    return this.rules
      .filter((r) => r.rule.isActive)
      .slice()
      .sort((a, b) => a.rule.priority - b.rule.priority);
  }

  async loadAll(): Promise<LoadedRule[]> {
    return this.rules.slice().sort((a, b) => a.rule.priority - b.rule.priority);
  }

  async getById(id: string): Promise<LoadedRule | null> {
    return this.rules.find((r) => r.rule.id === id) ?? null;
  }

  async create(input: LoadedRule): Promise<void> {
    this.rules.push(input);
  }

  async update(input: LoadedRule): Promise<void> {
    const idx = this.rules.findIndex((r) => r.rule.id === input.rule.id);
    if (idx !== -1) this.rules[idx] = input;
  }

  async delete(id: string): Promise<void> {
    const idx = this.rules.findIndex((r) => r.rule.id === id);
    if (idx !== -1) this.rules.splice(idx, 1);
  }
}
