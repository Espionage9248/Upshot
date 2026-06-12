import Database from "better-sqlite3-multiple-ciphers";

export interface EncryptedDbOptions {
  /** Database file path (e.g. "./data/upshot.db"). */
  url: string;
  /** 32-byte (or longer) secret. Lost key = unrecoverable data. */
  key: string;
}

export type RawDatabase = Database.Database;

/**
 * Open a SQLCipher-encrypted SQLite database. Applies the key BEFORE any other
 * statement, then enables WAL and foreign keys. Throws if the key is empty.
 */
export function openEncryptedDatabase({ url, key }: EncryptedDbOptions): RawDatabase {
  if (!key.trim()) {
    throw new Error("DB_ENCRYPTION_KEY is required to open the database");
  }
  const db = new Database(url);
  // SQLCipher-compatible page encryption. Key must be set before touching schema.
  db.pragma("cipher='sqlcipher'");
  db.pragma(`key='${key.replace(/'/g, "''")}'`);
  // Force decryption validation: reading the schema header touches encrypted pages,
  // so a wrong key fails fast here instead of silently later. Fail-fast matches the
  // app's security posture (PLAN-V2 §5) and guarantees the pragmas below actually apply.
  try {
    db.prepare("SELECT count(*) FROM sqlite_master").get();
  } catch (cause) {
    db.close();
    throw new Error("Failed to open encrypted database: wrong key or corrupt file", { cause });
  }
  // WAL can silently fall back to "delete" on some volumes; assert it actually applied.
  const journalMode = db.pragma("journal_mode = WAL", { simple: true });
  if (journalMode !== "wal") {
    db.close();
    throw new Error(`Expected WAL journal mode, got "${String(journalMode)}"`);
  }
  db.pragma("foreign_keys = ON");
  return db;
}
