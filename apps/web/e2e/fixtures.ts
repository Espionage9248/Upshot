import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { test as base } from "@playwright/test";
import { createDbClient, applyMigrations, seed, tables, type DbClient } from "@upshot/db";

/** Location + key of a freshly seeded temp encrypted DB for one e2e run. */
export interface TestDb {
  dbPath: string;
  key: string;
}

/**
 * Build a throwaway encrypted DB for the e2e run: migrate, seed reference data,
 * then add Today fixtures (accounts, an upcoming bill, recent job runs incl. a
 * 401 token-expired SYNC, and a couple of activity rows). NO auth user is
 * seeded — the journey creates it via the real /register passkey ceremony.
 *
 * Runs synchronously (drizzle's better-sqlite3 driver is sync) so it can be
 * called at Playwright config load to compute the server's DATABASE_URL. The key
 * is random per run (never a real secret, never committed) and the handle is
 * closed (WAL checkpointed) so the app under test can open the same file.
 */
export function seedTestDb(): TestDb {
  const dir = mkdtempSync(join(tmpdir(), "upshot-e2e-"));
  const dbPath = join(dir, "e2e.db");
  const key = randomBytes(16).toString("hex"); // 32 hex chars

  const { db, raw } = createDbClient({ url: dbPath, key });
  const client = db as DbClient;
  applyMigrations(client);
  seed(client);

  // Two accounts → a non-trivial integer net-worth sum on Today.
  client
    .insert(tables.accounts)
    .values([
      {
        id: "e2e-acc-spend",
        name: "Spending",
        type: "TRANSACTIONAL",
        ownership: "INDIVIDUAL",
        balanceCents: 248_300,
        role: "SPENDING",
      },
      {
        id: "e2e-acc-save",
        name: "Saver",
        type: "SAVER",
        ownership: "INDIVIDUAL",
        balanceCents: 1_842_900,
        role: "SAVER",
      },
    ])
    .run();

  // job_runs: a recent SUCCESS SYNC (latest → Today reads healthy) plus an
  // earlier FAILED-401 SYNC so the Runs table shows a 401 → Reconnect row.
  client
    .insert(tables.jobRuns)
    .values([
      {
        id: "e2e-sync-ok",
        job: "SYNC",
        status: "SUCCESS",
        startedAt: "2026-06-14T22:00:00.000Z",
        finishedAt: "2026-06-14T22:00:02.100Z",
        cursor: "cursor-latest",
        counts: { txns: 312, new: 4 },
      },
      {
        id: "e2e-sync-401",
        job: "SYNC",
        status: "FAILED",
        startedAt: "2026-06-13T09:00:00.000Z",
        finishedAt: "2026-06-13T09:00:01.000Z",
        error: "Up API auth failed (HTTP 401)",
      },
    ])
    .run();

  client
    .insert(tables.recurringItems)
    .values({
      id: "e2e-bill-phone",
      name: "Phone",
      kind: "BILL",
      amountCents: 4500,
      frequency: "MONTHLY",
      status: "ACTIVE",
      nextExpectedDate: "2026-06-18",
      merchant: "Telco",
      category: "Bills",
    })
    .run();

  client
    .insert(tables.eventLog)
    .values([
      {
        id: "e2e-evt-1",
        category: "transaction",
        action: "flag",
        description: "Flagged Officeworks as a tax deduction",
        createdAt: "2026-06-14T08:00:00.000Z",
      },
      {
        id: "e2e-evt-2",
        category: "rule",
        action: "create",
        description: "Created rule — merchant contains woolworths",
        createdAt: "2026-06-10T08:00:00.000Z",
      },
    ])
    .run();

  raw.pragma("wal_checkpoint(TRUNCATE)");
  raw.close();
  return { dbPath, key };
}

/**
 * Per-test fixture: attach a CDP WebAuthn **virtual authenticator** so the real
 * passkey register/login ceremonies run headlessly (Chromium only). The
 * authenticator holds resident credentials for the life of the browser context,
 * so "sign out" in the journey clears the session COOKIE (not the context) — a
 * fresh context would drop the credential and make passkey login impossible.
 */
export const test = base.extend<{ authenticatorId: string }>({
  authenticatorId: async ({ page }, use) => {
    const client = await page.context().newCDPSession(page);
    await client.send("WebAuthn.enable");
    const { authenticatorId } = await client.send("WebAuthn.addVirtualAuthenticator", {
      options: {
        protocol: "ctap2",
        transport: "internal",
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true,
        automaticPresenceSimulation: true,
      },
    });
    await use(authenticatorId);
  },
});

export { expect } from "@playwright/test";
