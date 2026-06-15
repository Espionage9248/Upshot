import { defineConfig, devices } from "@playwright/test";
import { seedTestDb } from "./e2e/fixtures";

/**
 * E2E gate (orchestrator-run). The journey exercises the real passkey ceremony
 * via a CDP virtual authenticator (Chromium only), so it runs against a
 * PRODUCTION build + `next start` — not `next dev`. The app's CSP is
 * `script-src 'self' 'nonce' 'strict-dynamic'` with no 'unsafe-eval'; dev-mode
 * HMR/React-Refresh rely on eval and would be blocked, breaking hydration. The
 * prod build emits no eval, so the locked-down CSP is exactly what we want to
 * test the journey behind.
 *
 * A fresh seeded temp encrypted DB is created at config load; its path + random
 * key are injected into the server's env. The env-free `next build` invariant is
 * verified separately by the orchestrator — these vars are present here only
 * because the server NEEDS them at runtime.
 */
const PORT = 3123;
const BASE_URL = `http://localhost:${PORT}`;

const { dbPath, key } = seedTestDb();

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  // Generous: the first hit of each route is server-rendered on demand.
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Self-contained: build (env present but unused — construction is lazy) then
    // start. ~build time dominates first run; acceptable for a one-shot gate.
    command: `pnpm run build && pnpm exec next start --port ${PORT}`,
    url: BASE_URL,
    timeout: 240_000,
    reuseExistingServer: false,
    env: {
      DB_ENCRYPTION_KEY: key,
      DATABASE_URL: dbPath,
      BETTER_AUTH_SECRET: "e2e-only-secret-not-real-0123456789abcdef",
      BETTER_AUTH_URL: BASE_URL,
      NEXT_PUBLIC_BETTER_AUTH_URL: BASE_URL,
      UPSHOT_RP_ID: "localhost",
    },
  },
});
