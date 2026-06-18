"use server";

/**
 * Match-rule Server Actions (auth-guarded wrappers).
 *
 * Security invariants (single-user app — non-negotiable):
 *   - Every action re-checks the session server-side via action(), which
 *     short-circuits an unauthenticated call before any DB access and returns a
 *     safe ActionResult.
 *   - UP_API_TOKEN is read AT REQUEST TIME (inside the handler), never at module
 *     scope. This preserves the env-free `next build` invariant.
 *   - No secret is ever passed to console.* / logged.
 *
 * The actual CRUD / preview / apply logic is the pure, db-injected core in
 * `rules-core.ts`. These wrappers stay thin so the action() result-contract
 * wraps them cleanly (a "use server" module may export only async functions +
 * `export type` re-exports).
 */

import { UpClient, type UpClientPort, type LoadedRule } from "@upshot/core";
import { action } from "@/lib/action";
import { getDb } from "@/lib/db";
import { listRules, saveRule, deleteRule, previewRule, applyRule } from "./rules-core";

export type { SaveRuleResult, ApplyRuleResult } from "./rules-core";

/**
 * Build the Up client lazily at request time. Returns null when UP_API_TOKEN
 * is absent (normal posture for local-only mode — no warning on missing token).
 */
function buildUpClient(): UpClientPort | null {
  const token = process.env.UP_API_TOKEN;
  return token ? new UpClient({ token, baseUrl: process.env.UP_API_BASE_URL }) : null;
}

/** Action: list all match rules. */
export const listRulesAction = action(async () => {
  const { db } = getDb();
  return listRules(db);
});

/** Action: create or update a match rule. Validates targets; bad target → typed result. */
export const saveRuleAction = action(async (_session, rule: LoadedRule) => {
  const { db } = getDb();
  return saveRule(db, rule);
});

/** Action: delete a match rule. */
export const deleteRuleAction = action(async (_session, id: string) => {
  const { db } = getDb();
  await deleteRule(db, id);
});

/** Action: preview how many transactions a (draft) rule would match. */
export const previewRuleAction = action(async (_session, rule: LoadedRule) => {
  const { db } = getDb();
  return previewRule(db, rule);
});

/** Action: apply a rule — plan, persist locally, best-effort push to Up. */
export const applyRuleAction = action(async (_session, id: string) => {
  const { db } = getDb();
  return applyRule(db, buildUpClient(), id);
});
