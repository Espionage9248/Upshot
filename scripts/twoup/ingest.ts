/**
 * 2Up historical ingest script.
 *
 * Usage:
 *   DB_ENCRYPTION_KEY=<key> DATABASE_URL=./data/upshot.db pnpm twoup:ingest [<dir>] [--dry-run]
 *
 * Reads all `2up-statement-YYYY-MM.pdf` files from <dir> (default: docs/2up),
 * reconciles each statement to the cent, classifies transactions, and upserts
 * into the database.  Pass --dry-run to reconcile without writing to the DB.
 *
 * Config: docs/2up/twoup.config.local.json (gitignored; owner-only).
 * See scripts/twoup/twoup.config.example.json for the template.
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, join, basename } from "node:path";
import { randomUUID } from "node:crypto";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { TextItem } from "pdfjs-dist/types/src/display/api";
import {
  assembleTransactions,
  parseSummary,
  reconcileStatement,
  classify,
  rowHash,
  type TwoUpConfig,
  type TwoUpTxn,
  type PositionedText,
} from "@upshot/core";
import { createDbClientFromEnv, DrizzleTwoUpRepo } from "@upshot/db";

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const dirArg = args.find((a) => !a.startsWith("--")) ?? "docs/2up";
const statementsDir = resolve(process.cwd(), dirArg);

// ---------------------------------------------------------------------------
// Load local config (PII — gitignored, owner-only)
// ---------------------------------------------------------------------------

const configPath = resolve(process.cwd(), "docs/2up/twoup.config.local.json");
if (!existsSync(configPath)) {
  console.error(
    `\nNo local config found at: ${configPath}\n` +
    `Copy the template and fill in your real tokens:\n` +
    `  cp scripts/twoup/twoup.config.example.json docs/2up/twoup.config.local.json\n` +
    `Then edit docs/2up/twoup.config.local.json (this file is gitignored).\n`,
  );
  process.exit(1);
}

const cfg = JSON.parse(readFileSync(configPath, "utf-8")) as TwoUpConfig;

// ---------------------------------------------------------------------------
// Derive statement year + handle Dec→Jan rollover within a statement
// ---------------------------------------------------------------------------

/**
 * Given a filename like "2up-statement-2021-05.pdf", returns the statement
 * start year (2021) and start month (5, 1-based).
 */
function parseFilenameDate(filename: string): { year: number; month: number } {
  const m = /2up-statement-(\d{4})-(\d{2})\.pdf$/i.exec(filename);
  if (!m) throw new Error(`Unexpected filename (expected 2up-statement-YYYY-MM.pdf): ${filename}`);
  return { year: parseInt(m[1]!, 10), month: parseInt(m[2]!, 10) };
}

/**
 * Given a raw date string like "2021-05-14" and the statement's start month,
 * return the correct year (handles a single Dec→Jan rollover per statement).
 */
function resolveYear(
  rawDate: string,
  statementYear: number,
  statementMonth: number,
): string {
  // rawDate is YYYY-MM-DD from parseStatementDate — the year embedded is the
  // start year passed to assembleTransactions.  We need to detect if a row
  // month rolled into the next calendar year (e.g. statement starts Dec, row
  // is Jan → year+1).
  const rowMonth = parseInt(rawDate.slice(5, 7), 10);
  if (statementMonth === 12 && rowMonth < statementMonth) {
    // Dec→Jan boundary: bump the year embedded in the date
    return `${statementYear + 1}${rawDate.slice(4)}`;
  }
  return rawDate;
}

// ---------------------------------------------------------------------------
// pdfjs helpers
// ---------------------------------------------------------------------------

async function extractPositionedText(pdfPath: string): Promise<PositionedText[]> {
  const data = readFileSync(pdfPath);
  const pdf = await getDocument({ data: new Uint8Array(data), verbosity: 0 }).promise;
  const items: PositionedText[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    for (const item of content.items) {
      const ti = item as TextItem;
      if (typeof ti.str === "string" && ti.str.trim() !== "") {
        items.push({
          x: ti.transform[4] as number,
          y: ti.transform[5] as number,
          str: ti.str,
        });
      }
    }
  }

  return items;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  // Find all statement PDFs, sorted by name (chronological order)
  const allFiles = readdirSync(statementsDir).sort();
  const pdfs = allFiles
    .filter((f) => /^2up-statement-\d{4}-\d{2}\.pdf$/i.test(f))
    .map((f) => join(statementsDir, f));

  if (pdfs.length === 0) {
    console.error(`No 2up-statement-YYYY-MM.pdf files found in: ${statementsDir}`);
    process.exit(1);
  }

  // Set up DB client (skipped in dry-run, but we still need it for non-dry-run)
  let repo: DrizzleTwoUpRepo | null = null;
  if (!dryRun) {
    const { db } = createDbClientFromEnv();
    repo = new DrizzleTwoUpRepo(db);
  }

  let anyFailed = false;

  for (const pdfPath of pdfs) {
    const filename = basename(pdfPath);
    const { year: statementYear, month: statementMonth } = parseFilenameDate(filename);
    const label = `${statementYear}-${String(statementMonth).padStart(2, "0")}`;

    try {
      // 1. Extract positioned text from all pages
      const items = await extractPositionedText(pdfPath);

      // 2. Assemble raw rows + parse summary
      const rawRows = assembleTransactions(items, { year: statementYear });
      const summary = parseSummary(items);

      // 3. Reconcile to the cent — abort this file on failure
      const recon = reconcileStatement(rawRows, summary);
      if (!recon.ok) {
        console.error(`✗ ${label}  ${recon.rowCount} rows  RECONCILIATION FAILED:`);
        for (const err of recon.errors) {
          console.error(`    ${err}`);
        }
        anyFailed = true;
        continue;
      }

      // 4. Classify + build TwoUpTxn rows
      const txns: TwoUpTxn[] = rawRows.map((row) => {
        const { owner, category } = classify(row.description, row.amountCents, cfg);
        const hash = rowHash({
          date: row.date,
          time: row.time,
          amountCents: row.amountCents,
          balanceCents: row.balanceCents,
        });
        // Resolve the correct year for Dec→Jan rollover
        const resolvedDate = resolveYear(row.date, statementYear, statementMonth);
        return {
          id: randomUUID(),
          rowHash: hash,
          date: resolvedDate,
          description: row.description,
          amountCents: row.amountCents,
          owner,
          category,
        };
      });

      if (dryRun) {
        console.log(`✓ ${label}  ${recon.rowCount} rows  reconciled (dry-run)`);
      } else {
        const inserted = repo!.upsertMany(txns);
        console.log(`✓ ${label}  ${recon.rowCount} rows  reconciled  ${inserted} inserted`);
      }
    } catch (err) {
      console.error(`✗ ${label}  ERROR: ${err instanceof Error ? err.message : String(err)}`);
      anyFailed = true;
    }
  }

  if (anyFailed) {
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error("Fatal error:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
