import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import type { DbClient } from "./client";

// In the worker container the bundled module location differs from source, so the
// relative `../drizzle` would miss. MIGRATIONS_DIR lets the container point at the
// copied SQL explicitly; dev/test keep the source-relative fallback.
const migrationsFolder =
  process.env.MIGRATIONS_DIR ??
  join(dirname(fileURLToPath(import.meta.url)), "..", "drizzle");

/** Apply all generated migrations to an open encrypted client. */
export function applyMigrations(db: DbClient): void {
  migrate(db, { migrationsFolder });
}
