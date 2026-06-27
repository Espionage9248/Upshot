// packages/core/src/scenarios/types.ts
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
