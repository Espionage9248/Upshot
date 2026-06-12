import { drizzle } from "drizzle-orm/better-sqlite3";
import { openEncryptedDatabase, type EncryptedDbOptions, type RawDatabase } from "./encryption";
import { schema } from "./schema";

export type DbClient = ReturnType<typeof createDbClient>["db"];

/** Open the encrypted DB and wrap it with Drizzle (snake_case column mapping). */
export function createDbClient(options: EncryptedDbOptions): { db: ReturnType<typeof wrap>; raw: RawDatabase } {
  const raw = openEncryptedDatabase(options);
  return { db: wrap(raw), raw };
}

function wrap(raw: RawDatabase) {
  return drizzle(raw, { schema, casing: "snake_case" });
}

/** Read the key + path from the environment; fail fast if the key is absent. */
export function createDbClientFromEnv(): { db: ReturnType<typeof wrap>; raw: RawDatabase } {
  const key = process.env.DB_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("DB_ENCRYPTION_KEY is not set; refusing to start without encryption-at-rest");
  }
  const url = process.env.DATABASE_URL ?? "./data/upshot.db";
  return createDbClient({ url, key });
}
