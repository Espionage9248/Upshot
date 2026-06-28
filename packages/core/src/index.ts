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
export { applyRules, evaluateCondition, type MatchTarget, type LinkIntent } from "./match/engine";
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
export { monthsUntil } from "./budget";

// Net worth (Phase 4)
export { computeNetWorth } from "./networth";
export type { NetWorthInput } from "./networth";
export { computeMonthlySnapshot } from "./networth/snapshot";
export type { MonthlySnapshotInput, MonthlySnapshot } from "./networth/snapshot";

// Installments (Phase 5)
export { matchInstallments, planProgress, bnplRollup, BNPL_RECENT_MATCH_WINDOW_DAYS } from "./installments";
export type { InstallmentPlanInput, MatchableTransaction, InstallmentMatch, PlanUpdate } from "./installments";

// Debts (Phase 5)
export { addMonths, monthsBetween, computeSnowball, computeWhatIf, utilisation, accrueFee, matchDebtPayments, compilePatternRegex, effectiveDebtPaymentCents } from "./debt";
export type { DebtStrategy, DebtInput, MonthlyPayment, PayoffSchedule, SnowballAnalysis, FeeAccrualInput, DebtMatcher, DebtPaymentMatch, DebtBalanceUpdate } from "./debt";
export type { DebtRepo, NewDebt, RecordDebtPayment, DebtProjection } from "./ports";
export { InMemoryDebtRepo } from "./testing/in-memory-debt-repo";
export type { InstallmentRepo, NewInstallmentPlan } from "./ports";
export { InMemoryInstallmentRepo } from "./testing/in-memory-installment-repo";

// Purchases (Plan Room)
export { monthlySaveTarget } from "./purchases";

// Payoff planner (Scenario Planner)
export { orderByStrategy, simulatePayoff, solveExtraForTargetDate, headroomCents, evaluatePlanStatus } from "./payoff";
export type {
  PayoffDebtInput,
  LumpSum,
  ExtraStep,
  PayoffInputs,
  PayoffResult,
  PlanStatus,
  EvaluatePlanStatusArgs,
} from "./payoff";

// Reports (Phase 6)
export * from "./reports";

// Scenarios / Forecast (Phase 6.2)
export * from "./scenarios";

// Recurring (Phase 5)
export { detectRecurring, detectFrequency, nextExpectedDate } from "./recurring";
export { toMonthlyCostCents } from "./recurring";
export { inferRecurringKind } from "./recurring";
export { priceDrift, findOverlaps } from "./recurring";
export type { Frequency, DetectableTransaction, DetectedRecurring, DriftResult, OverlapGroup } from "./recurring";
export type { RecurringRepo, NewRecurring } from "./ports";
export { InMemoryRecurringRepo } from "./testing/in-memory-recurring-repo";

// Tax (Phase 6.3)
export * from "./tax";

// Export (Phase 6.3)
export * from "./export";
