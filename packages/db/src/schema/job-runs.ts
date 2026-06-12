import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { JOB_NAMES, JOB_STATUSES } from "@upshot/contracts";

export const jobRuns = sqliteTable("job_runs", {
  id: text().primaryKey(),
  job: text({ enum: JOB_NAMES }).notNull(),
  status: text({ enum: JOB_STATUSES }).notNull(),
  startedAt: text().notNull().$defaultFn(() => new Date().toISOString()),
  finishedAt: text(),
  cursor: text(),
  counts: text({ mode: "json" }).$type<Record<string, number>>(),
  error: text(),
  attempt: integer().notNull().default(1),
});
