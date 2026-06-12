import type { DbClient } from "./client";
import { appSettings, matchRules, matchConditions, matchActions } from "./schema";

/**
 * Seed the singleton settings row and ONE generic saver-interest rule.
 * NO personal data (Patreon/salary/Zip/ignored-subscription rules) is seeded here —
 * those are created via the Phase 4.3 match-rule editor UI. The V1 logic to port is
 * recorded in the Phase 1 plan, Appendix A. (PLAN-V2 §3: no personal data in source.)
 */
export function seed(db: DbClient): void {
  db.insert(appSettings).values({ id: "default" }).onConflictDoNothing().run();

  const ruleId = "seed-saver-interest";
  db.insert(matchRules)
    .values({ id: ruleId, name: "Saver interest", isActive: true, priority: 100 })
    .onConflictDoNothing()
    .run();
  db.insert(matchConditions)
    .values({
      id: `${ruleId}-cond`, ruleId, field: "description", mode: "contains", value: "interest",
    })
    .onConflictDoNothing()
    .run();
  db.insert(matchActions)
    .values({ id: `${ruleId}-action`, ruleId, type: "MARK_INTEREST" })
    .onConflictDoNothing()
    .run();
}
