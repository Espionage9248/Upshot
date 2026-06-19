export { Money, DEFAULT_CURRENCY } from "./money/money";
export type { AccountRepo, NewAccount, TransactionRepo, NewTransaction } from "./ports";
export type { JobRunRepo, CreateJobRun, FinishJobRun } from "./ports";
export type { CategoryRepo } from "./ports";
export type { MatchRuleRepo, LoadedRule } from "./ports";
export type { SettingsRepo, SettingsPatch } from "./ports";
export type { BudgetAllocationRepo, NewBudgetAllocation } from "./ports";
export type { AssetRepo, NewAsset } from "./ports";
export { InMemoryAccountRepo } from "./testing/in-memory-account-repo";
export { InMemoryTransactionRepo } from "./testing/in-memory-transaction-repo";
export { repoContract, type RepoUnderTest } from "./repo-contract";

// Up sync (Phase 2)
export { UpClient, type UpClientOptions } from "./up/client";
export {
  UpHttpError, UpAuthError,
  type UpClientPort, type UpAccountResource, type UpTransactionResource,
  type UpCategoryResource, type UpListResponse, type UpMoney, type MappedAccount,
} from "./up/types";
export { mapAccount, mapTransaction, mapCategory } from "./up/mappers";
export { withRetry, type RetryOptions } from "./up/retry";
export { applyRules, evaluateCondition, type MatchTarget } from "./match/engine";
export { previewMatches, planRuleApplication, validateRuleTargets } from "./match/apply";
export type { RulePatch } from "./match/apply";
export { SyncService, INCREMENTAL_OVERLAP_MS, type SyncDeps, type SyncResult } from "./sync/sync-service";
export { computeSyncHealth, type SyncHealth } from "./health/health";
export { InMemoryJobRunRepo } from "./testing/in-memory-job-run-repo";
export { InMemoryCategoryRepo } from "./testing/in-memory-category-repo";
export { InMemoryMatchRuleRepo } from "./testing/in-memory-match-rule-repo";
export { InMemorySettingsRepo } from "./testing/in-memory-settings-repo";

// Budgeting (Phase 4)
export { analyseSaver, analyseAllSavers } from "./budget";
export type { SaverInput, SaverTransaction, SaverBudgetAnalysis, SaverMonthHistory } from "./budget";
export { analyseEmergencyFund } from "./budget";
export type { EmergencyFundInput, EmergencyFundAccount, EmergencyFundAnalysis } from "./budget";
export { goalConfidence } from "./budget";
export type { GoalConfidenceInput, GoalConfidenceResult } from "./budget";
