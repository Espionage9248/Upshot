// packages/core/src/scenarios/types.ts
export interface SalaryChangeDebt { id: string; currentBalanceCents: number; minimumPaymentCents: number; interestRate: number | null; }
export interface SalaryChangeSaver { saverId: string; saverName: string; monthlyAllocationCents: number; }
export interface SalaryChangeInput {
  currentMonthlyIncomeCents: number;
  newMonthlyIncomeCents: number;
  monthlyExpensesCents: number;          // total saver/envelope spend baseline
  monthlyExplicitSavingsCents: number;   // deposits into non-spending savers this month
  hasExplicitSavingsAccounts: boolean;
  debts: SalaryChangeDebt[];             // includeInSnowball only
  debtStrategy: "SNOWBALL" | "AVALANCHE" | "CUSTOM";
  customOrder?: string[];
  savers: SalaryChangeSaver[];
  startMonth: string;                    // "yyyy-MM"
}
export interface DebtPayoffImpact { monthsSaved: number; interestSavedCents: number; newDebtFreeMonth: string | null; }
export interface AllocationSuggestion {
  saverId: string; saverName: string; currentAllocationCents: number;
  suggestedAllocationCents: number; changeCents: number; changePct: number;
}
export interface SalaryChangeResult {
  currentIncomeCents: number; newIncomeCents: number;
  incomeChangeCents: number; incomeChangePct: number;
  currentSavingsRate: number; projectedSavingsRate: number;   // 0..100
  currentDTI: number; projectedDTI: number;                   // 0..100
  additionalMonthlyFreedomCents: number;
  debtPayoffImpact: DebtPayoffImpact | null;
  allocationSuggestions: AllocationSuggestion[];
}

export interface ForecastSalary { cadenceDays: 7 | 14 | 30; amountCents: number; lastPayISO: string; }
export interface ScheduledOutflow { dateISO: string; amountCents: number; } // amountCents > 0 magnitude
export interface ActualDailyNet { dateISO: string; netCents: number; } // signed daily net flow
export interface ForecastInput {
  nowISO: string;
  startBalanceCents: number;
  actualDailyNet: ActualDailyNet[];        // ascending date; last ~30d
  salary: ForecastSalary | null;
  scheduledOutflows: ScheduledOutflow[];   // all future, any horizon; engine filters
  perPayCycleAllocationCents: number;       // saver outflow per pay-day (>= 0)
  avgDailyDiscretionaryCents: number;       // >= 0
  stdDevDailyDiscretionaryCents: number;    // >= 0
  bandK?: number;                           // default 1.0
}
export interface ForecastDay { dateISO: string; centralCents: number; lowCents: number; highCents: number; }
export interface ForecastActualDay { dateISO: string; balanceCents: number; }
export interface CashflowForecast {
  startBalanceCents: number;
  actual: ForecastActualDay[];
  projected: ForecastDay[];
  lowestProjectedCents: number;
  lowestDateISO: string;
  overdraftRisk: boolean;
  horizon: 30 | 60 | 90;
}
