export * from "./accounts";
export * from "./categories";
export * from "./transactions";
export * from "./tags";
export * from "./match-rules";
export * from "./budget";
export * from "./debts";
export * from "./installments";
export * from "./recurring";
export * from "./purchases";
export * from "./settings";
export * from "./snapshots";
export * from "./dashboard";
export * from "./event-log";
export * from "./job-runs";
export * from "./two-up";
export * from "./assets";

import * as accounts from "./accounts";
import * as categories from "./categories";
import * as transactions from "./transactions";
import * as tags from "./tags";
import * as matchRules from "./match-rules";
import * as budget from "./budget";
import * as debts from "./debts";
import * as installments from "./installments";
import * as recurring from "./recurring";
import * as purchases from "./purchases";
import * as settings from "./settings";
import * as snapshots from "./snapshots";
import * as dashboard from "./dashboard";
import * as eventLog from "./event-log";
import * as jobRuns from "./job-runs";
import * as twoUp from "./two-up";
import * as assets from "./assets";

/** Aggregate schema object passed to drizzle({ schema }). */
export const schema = {
  ...accounts, ...categories, ...transactions, ...tags, ...matchRules, ...budget,
  ...debts, ...installments, ...recurring, ...purchases, ...settings, ...snapshots,
  ...dashboard, ...eventLog, ...jobRuns, ...twoUp, ...assets,
};
