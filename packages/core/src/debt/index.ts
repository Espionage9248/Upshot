export { addMonths, monthsBetween } from "./months";
export { computeSnowball, computeWhatIf } from "./snowball";
export { utilisation } from "./utilisation";
export { accrueFee } from "./fees";
export type { FeeAccrualInput } from "./fees";
export { matchDebtPayments, compilePatternRegex } from "./match-payments";
export type { DebtMatcher, DebtPaymentMatch, DebtBalanceUpdate } from "./match-payments";
export type {
  DebtStrategy,
  DebtInput,
  MonthlyPayment,
  PayoffSchedule,
  SnowballAnalysis,
} from "./types";
