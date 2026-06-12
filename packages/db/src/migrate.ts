import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import type { DbClient } from "./client";

const migrationsFolder = join(dirname(fileURLToPath(import.meta.url)), "..", "drizzle");

/** Apply all generated migrations to an open encrypted client. */
export function applyMigrations(db: DbClient): void {
  migrate(db, { migrationsFolder });
}
