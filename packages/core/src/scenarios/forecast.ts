// packages/core/src/scenarios/forecast.ts
import type {
  ForecastInput,
  CashflowForecast,
  ForecastDay,
  ForecastActualDay,
} from "./types";

const DAY_MS = 86_400_000;

/** "yyyy-MM-dd" for a Date (UTC). */
function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Parse "yyyy-MM-dd" (or ISO) to a UTC midnight Date. */
function parseDay(iso: string): Date {
  return new Date(iso.slice(0, 10) + "T00:00:00.000Z");
}

/** Shift weekend dates back to the preceding Friday (Up pays last business day). */
function toPrecedingWeekday(d: Date): Date {
  const dow = d.getUTCDay(); // 0=Sun..6=Sat
  if (dow === 0) return new Date(d.getTime() - 2 * DAY_MS);
  if (dow === 6) return new Date(d.getTime() - 1 * DAY_MS);
  return d;
}

export function buildCashflowForecast(
  input: ForecastInput,
  horizon: 30 | 60 | 90,
): CashflowForecast {
  const bandK = input.bandK ?? 1.0;
  const now = parseDay(input.nowISO);
  const horizonEnd = new Date(now.getTime() + horizon * DAY_MS);

  // 1. Reconstruct the actual line: walk backwards from startBalance.
  // actualDailyNet is ascending; the last entry's balance == startBalance.
  const actual: ForecastActualDay[] = [];
  let bal = input.startBalanceCents;
  for (let i = input.actualDailyNet.length - 1; i >= 0; i--) {
    const entry = input.actualDailyNet[i]!;
    actual.unshift({ dateISO: entry.dateISO, balanceCents: bal });
    bal -= entry.netCents; // undo this day's flow to get the prior day's close
  }

  // 2. Project salary inflows + pay-day saver allocations into a day→delta map.
  const inflowByDay = new Map<string, number>();
  const allocByDay = new Map<string, number>();
  if (input.salary) {
    const { cadenceDays, amountCents, lastPayISO } = input.salary;
    let next = new Date(parseDay(lastPayISO).getTime() + cadenceDays * DAY_MS);
    while (next <= horizonEnd) {
      if (next > now) {
        const payKey = ymd(toPrecedingWeekday(next));
        inflowByDay.set(payKey, (inflowByDay.get(payKey) ?? 0) + amountCents);
        if (input.perPayCycleAllocationCents > 0) {
          allocByDay.set(payKey, (allocByDay.get(payKey) ?? 0) + input.perPayCycleAllocationCents);
        }
      }
      next = new Date(next.getTime() + cadenceDays * DAY_MS);
    }
  }

  // 3. Scheduled outflows by day (magnitude → subtract).
  const outflowByDay = new Map<string, number>();
  for (const o of input.scheduledOutflows) {
    const key = o.dateISO.slice(0, 10);
    outflowByDay.set(key, (outflowByDay.get(key) ?? 0) + o.amountCents);
  }

  // 4. Walk day 1..horizon. Income applied before same-day outflows is implicit
  // here because we net the whole day; central never dips mid-day.
  const projected: ForecastDay[] = [];
  let running = input.startBalanceCents;
  let lowest = Number.POSITIVE_INFINITY;
  let lowestDateISO = ymd(now);

  for (let d = 1; d <= horizon; d++) {
    const dayDate = new Date(now.getTime() + d * DAY_MS);
    const key = ymd(dayDate);
    const inflow = inflowByDay.get(key) ?? 0;
    const outflow = (outflowByDay.get(key) ?? 0) + (allocByDay.get(key) ?? 0);
    running = running + inflow - outflow - input.avgDailyDiscretionaryCents;
    const central = Math.round(running);

    const halfWidth = Math.round(bandK * input.stdDevDailyDiscretionaryCents * Math.sqrt(d));
    projected.push({
      dateISO: key,
      centralCents: central,
      lowCents: central - halfWidth,
      highCents: central + halfWidth,
    });

    if (central < lowest) {
      lowest = central;
      lowestDateISO = key;
    }
  }

  return {
    startBalanceCents: input.startBalanceCents,
    actual,
    projected,
    lowestProjectedCents: lowest === Number.POSITIVE_INFINITY ? input.startBalanceCents : lowest,
    lowestDateISO,
    overdraftRisk: lowest < 0,
    horizon,
  };
}
