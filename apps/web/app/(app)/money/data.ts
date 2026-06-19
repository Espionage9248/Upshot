import { and, count, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { tables, type DbClient } from "@upshot/db";

/** Transaction row shape derived directly from the Drizzle schema (no @upshot/contracts dep). */
export type TransactionRow = typeof tables.transactions.$inferSelect;

/** Supported filter values for the ledger query. All fields are optional. */
export interface LedgerFilters {
  /** Filter to a single account. */
  accountId?: string;
  /** Filter by settlement status ("HELD" or "SETTLED"). */
  status?: "HELD" | "SETTLED";
  /** Filter to a single category. */
  categoryId?: string;
  /** Filter to transactions tagged with this tag id (join-table subquery). */
  tagId?: string;
  /** Include only salary transactions. */
  isSalary?: boolean;
  /** Include only transfer transactions. */
  isTransfer?: boolean;
  /** Include only interest transactions. */
  isInterest?: boolean;
  /** Include only tax-deductible transactions. */
  isTaxDeductible?: boolean;
  /** Inclusive lower bound on createdAt (ISO 8601 string). */
  from?: string;
  /** Inclusive upper bound on createdAt (ISO 8601 string). */
  to?: string;
  /**
   * Free-text search on description (case-insensitive SQLite LIKE).
   * Matches rows where description contains this substring.
   */
  q?: string;
}

/** Page size for offset pagination. */
const PAGE_SIZE = 50;

export interface LedgerResult {
  rows: TransactionRow[];
  /** Total matching rows (same where clause, no pagination). */
  total: number;
  /**
   * Whether there is at least one more page after this one.
   * `hasNext = offset + rows.length < total`
   */
  hasNext: boolean;
}

/**
 * Server-only loader for the /money ledger. Reads the encrypted DB in-process
 * via the injected `db` parameter — constructs nothing at module load (preserves
 * the env-free `next build` invariant and keeps it testable).
 *
 * Pagination is 0-based: page 0 returns the first 50 rows, page 1 returns the
 * next 50, and so on (offset = page × PAGE_SIZE).
 *
 * Filters compose with AND semantics; absent filter fields are ignored.
 * Ordering is always `createdAt` DESC.
 */
export async function loadLedger(
  db: DbClient,
  filters: LedgerFilters,
  page: number,
): Promise<LedgerResult> {
  const conditions = buildWhere(db, filters);
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const offset = page * PAGE_SIZE;

  const rows = db
    .select()
    .from(tables.transactions)
    .where(where)
    .orderBy(desc(tables.transactions.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset)
    .all();

  const countResult = db
    .select({ value: count() })
    .from(tables.transactions)
    .where(where)
    .get();
  const total = countResult?.value ?? 0;

  return {
    rows,
    total,
    hasNext: offset + rows.length < total,
  };
}

/** Build the array of drizzle-orm condition expressions for the given filters. */
function buildWhere(db: DbClient, filters: LedgerFilters) {
  const conds: SQL[] = [];

  if (filters.accountId !== undefined) {
    conds.push(eq(tables.transactions.accountId, filters.accountId));
  }
  if (filters.status !== undefined) {
    conds.push(eq(tables.transactions.status, filters.status));
  }
  if (filters.categoryId !== undefined) {
    conds.push(eq(tables.transactions.categoryId, filters.categoryId));
  }
  if (filters.tagId !== undefined) {
    // Subquery: transaction ids that have this tag
    const taggedIds = db
      .select({ transactionId: tables.transactionTags.transactionId })
      .from(tables.transactionTags)
      .where(eq(tables.transactionTags.tagId, filters.tagId));
    conds.push(inArray(tables.transactions.id, taggedIds));
  }
  if (filters.isSalary !== undefined) {
    conds.push(eq(tables.transactions.isSalary, filters.isSalary));
  }
  if (filters.isTransfer !== undefined) {
    conds.push(eq(tables.transactions.isTransfer, filters.isTransfer));
  }
  if (filters.isInterest !== undefined) {
    conds.push(eq(tables.transactions.isInterest, filters.isInterest));
  }
  if (filters.isTaxDeductible !== undefined) {
    conds.push(eq(tables.transactions.isTaxDeductible, filters.isTaxDeductible));
  }
  if (filters.from !== undefined) {
    conds.push(gte(tables.transactions.createdAt, filters.from));
  }
  if (filters.to !== undefined) {
    conds.push(lte(tables.transactions.createdAt, filters.to));
  }
  if (filters.q !== undefined && filters.q.length > 0) {
    // Escape LIKE metacharacters so the query is a literal substring match.
    // SQLite LIKE remains ASCII-case-insensitive; this does not change that.
    const escaped = filters.q.replace(/[\\%_]/g, (ch) => `\\${ch}`);
    conds.push(sql`${tables.transactions.description} LIKE ${`%${escaped}%`} ESCAPE '\\'`);
  }

  return conds;
}
