import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { MATCH_FIELDS, MATCH_MODES, MATCH_ACTION_TYPES } from "@upshot/contracts";

export const matchRules = sqliteTable("match_rules", {
  id: text().primaryKey(),
  name: text().notNull(),
  isActive: integer({ mode: "boolean" }).notNull().default(true),
  priority: integer().notNull(),
});

export const matchConditions = sqliteTable("match_conditions", {
  id: text().primaryKey(),
  ruleId: text().notNull().references(() => matchRules.id, { onDelete: "cascade" }),
  field: text({ enum: MATCH_FIELDS }).notNull(),
  mode: text({ enum: MATCH_MODES }).notNull(),
  value: text().notNull(),
  amountCents: integer(),
  toleranceCents: integer(),
  currency: text(),
});

export const matchActions = sqliteTable("match_actions", {
  id: text().primaryKey(),
  ruleId: text().notNull().references(() => matchRules.id, { onDelete: "cascade" }),
  type: text({ enum: MATCH_ACTION_TYPES }).notNull(),
  value: text(),
  targetId: text(),
});
