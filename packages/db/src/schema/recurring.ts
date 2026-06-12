import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { RECURRING_KINDS, RECURRING_FREQUENCIES, RECURRING_STATUSES } from "@upshot/contracts";
import { matchRules } from "./match-rules";
import { accounts } from "./accounts";

export const recurringItems = sqliteTable(
  "recurring_items",
  {
    id: text().primaryKey(),
    name: text().notNull(),
    kind: text({ enum: RECURRING_KINDS }).notNull(),
    amountCents: integer().notNull(),
    frequency: text({ enum: RECURRING_FREQUENCIES }).notNull(),
    lastAmountCents: integer(),
    priceLastChangedAt: text(),
    usageCount: integer().notNull().default(0),
    usageResetAt: text(),
    category: text(),
    merchant: text(),
    status: text({ enum: RECURRING_STATUSES }).notNull(),
    matchRuleId: text().references(() => matchRules.id),
    nextExpectedDate: text(),
    lastDetectedDate: text(),
    firstDetectedDate: text(),
    accountId: text().references(() => accounts.id),
    isAutoDetected: integer({ mode: "boolean" }).notNull().default(false),
    notes: text(),
  },
  (t) => [index("recurring_status_idx").on(t.status), index("recurring_next_idx").on(t.nextExpectedDate)],
);
