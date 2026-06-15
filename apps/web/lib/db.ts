/**
 * In-process encrypted DB singleton.
 *
 * `createDbClientFromEnv()` reads DB_ENCRYPTION_KEY / DATABASE_URL from the
 * environment and throws a clear error at boot if the key is missing (it never
 * logs the key). We memoize the client on `globalThis` so Turbopack HMR in dev
 * does not open a new better-sqlite3 connection on every hot reload.
 */

import { createDbClientFromEnv } from "@upshot/db";

type Client = ReturnType<typeof createDbClientFromEnv>;

const g = globalThis as unknown as { __upshotDb?: Client };

export function getDb(): Client {
  return (g.__upshotDb ??= createDbClientFromEnv());
}
