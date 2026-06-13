import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { ASSET_TYPES } from "@upshot/contracts";

export const assets = sqliteTable(
  "assets",
  {
    id: text().primaryKey(),
    name: text().notNull(),
    type: text({ enum: ASSET_TYPES }).notNull(),
    valueCents: integer().notNull(),
    institution: text(),
    notes: text(),
    includeInNetWorth: integer({ mode: "boolean" }).notNull().default(true),
    lastValuedAt: text(),
    createdAt: text().notNull().$defaultFn(() => new Date().toISOString()),
    updatedAt: text().notNull().$defaultFn(() => new Date().toISOString()),
  },
  (t) => [index("assets_type_idx").on(t.type)],
);

export const assetValuations = sqliteTable("asset_valuations", {
  id: text().primaryKey(),
  assetId: text().notNull().references(() => assets.id, { onDelete: "cascade" }),
  valueCents: integer().notNull(),
  valuedAt: text().notNull(),
});
