import type { SyncHealth } from "@upshot/core";
import type { SyncState } from "@upshot/ui";

/**
 * Canonical SyncHealth → SyncState mapping (token wins, then last status).
 *
 * Lives in its own module — with no `@upshot/db` (native better-sqlite3) in its
 * import graph — so the client `<TopBar>` can import it without pulling the DB
 * driver into the browser bundle. `loadSyncHealth` (server-only, DB-bound) lives
 * in `./sync-health`, which re-exports this for a single import path.
 */
export function syncHealthToState(h: SyncHealth): SyncState {
  if (!h.tokenHealthy) return "token";
  if (h.lastStatus === "FAILED") return "failed";
  if (h.lastStatus === "RUNNING") return "syncing";
  return "healthy";
}
