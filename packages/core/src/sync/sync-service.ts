// packages/core/src/sync/sync-service.ts
import { randomUUID } from "node:crypto";
import type { AccountRole, AccountType } from "@upshot/contracts";
import type { AccountRepo } from "../ports/account-repo";
import type { TransactionRepo } from "../ports/transaction-repo";
import type { CategoryRepo } from "../ports/category-repo";
import type { MatchRuleRepo } from "../ports/match-rule-repo";
import type { JobRunRepo } from "../ports/job-run-repo";
import { UpAuthError, type UpClientPort } from "../up/types";
import { mapAccount, mapCategory, mapTransaction } from "../up/mappers";
import { applyRules, type MatchTarget } from "../match/engine";

export const INCREMENTAL_OVERLAP_MS = 7 * 24 * 60 * 60 * 1000;

export interface SyncDeps {
  up: UpClientPort;
  accounts: AccountRepo;
  transactions: TransactionRepo;
  categories: CategoryRepo;
  matchRules: MatchRuleRepo;
  jobRuns: JobRunRepo;
  newId?: () => string;
  now?: () => Date;
}

export interface SyncResult {
  jobRunId: string;
  status: "SUCCESS" | "FAILED";
  counts: Record<string, number>;
  authFailed: boolean;
  error?: string;
}

export class SyncService {
  constructor(private readonly deps: SyncDeps) {}

  async sync(opts: { mode: "full" | "incremental" }): Promise<SyncResult> {
    const now = this.deps.now ?? (() => new Date());
    const newId = this.deps.newId ?? (() => randomUUID());
    const startedAt = now().toISOString();
    const id = newId();
    await this.deps.jobRuns.create({ id, job: "SYNC", startedAt });

    try {
      const since = await this.resolveSince(opts.mode);

      const cats = await this.deps.up.listCategories();
      for (const c of cats) await this.deps.categories.upsert(mapCategory(c));
      const nameById = new Map(cats.map((c) => [c.id, c.attributes.name]));

      const upAccounts = await this.deps.up.listAccounts();
      for (const a of upAccounts) {
        const mapped = mapAccount(a);
        const existing = await this.deps.accounts.getById(mapped.id);
        await this.deps.accounts.upsert({
          ...mapped,
          role: existing?.role ?? defaultRole(mapped.type),
          monthlyAllocationCents: existing?.monthlyAllocationCents ?? 0,
          lastSyncedAt: startedAt,
        });
      }

      const rules = await this.deps.matchRules.loadActive();
      const upTxns = await this.deps.up.listTransactions(since ? { since } : undefined);
      let rulesApplied = 0;
      for (const r of upTxns) {
        const mapped = mapTransaction(r);
        const target: MatchTarget = {
          description: mapped.description,
          categoryName: mapped.categoryId ? nameById.get(mapped.categoryId) ?? null : null,
          rawText: mapped.rawText,
          amountCents: mapped.amountCents,
          currency: mapped.currency,
          foreignAmountCents: mapped.foreignAmountCents,
          foreignCurrency: mapped.foreignCurrency,
        };
        const { transaction, applied } = applyRules(mapped, target, rules);
        rulesApplied += applied.length;
        await this.deps.transactions.upsert(transaction);
      }

      const counts = { categories: cats.length, accounts: upAccounts.length, transactions: upTxns.length, rulesApplied };
      await this.deps.jobRuns.finish(id, { status: "SUCCESS", finishedAt: now().toISOString(), cursor: startedAt, counts, error: null });
      return { jobRunId: id, status: "SUCCESS", counts, authFailed: false };
    } catch (err) {
      const authFailed = err instanceof UpAuthError;
      const message = err instanceof Error ? err.message : String(err);
      await this.deps.jobRuns.finish(id, { status: "FAILED", finishedAt: now().toISOString(), cursor: null, counts: null, error: message });
      return { jobRunId: id, status: "FAILED", counts: {}, authFailed, error: message };
    }
  }

  private async resolveSince(mode: "full" | "incremental"): Promise<string | undefined> {
    if (mode === "full") return undefined;
    const cursor = await this.deps.jobRuns.latestSuccessfulCursor("SYNC");
    if (!cursor) return undefined;
    const cursorMs = new Date(cursor).getTime();
    // A poison (unparseable) cursor must not break every future incremental sync — degrade to a full scan.
    if (Number.isNaN(cursorMs)) return undefined;
    return new Date(cursorMs - INCREMENTAL_OVERLAP_MS).toISOString();
  }
}

function defaultRole(type: AccountType): AccountRole {
  if (type === "SAVER") return "SAVER";
  if (type === "TRANSACTIONAL") return "SPENDING";
  return "NONE";
}
