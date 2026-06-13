import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { ACCOUNT_TYPES, ACCOUNT_OWNERSHIPS, ACCOUNT_ROLES } from "@upshot/contracts";

export const accounts = sqliteTable(
  "accounts",
  {
    id: text().primaryKey(),
    name: text().notNull(),
    type: text({ enum: ACCOUNT_TYPES }).notNull(),
    ownership: text({ enum: ACCOUNT_OWNERSHIPS }).notNull(),
    balanceCents: integer().notNull(),
    role: text({ enum: ACCOUNT_ROLES }).notNull(),
    monthlyAllocationCents: integer().notNull().default(0),
    createdAt: text().notNull().$defaultFn(() => new Date().toISOString()),
    updatedAt: text().notNull().$defaultFn(() => new Date().toISOString()),
    lastSyncedAt: text(),
  },
  (t) => [index("accounts_type_idx").on(t.type), index("accounts_role_idx").on(t.role)],
);
