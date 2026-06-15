import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { loadSyncHealth } from "@/lib/sync-health";

// Reads the encrypted DB at request time (getDb), so this route must never be
// statically prerendered — keeps the env-free `next build` invariant.
export const dynamic = "force-dynamic";

/**
 * Sync-health JSON for the top-bar pill (and, later, Settings). Auth-gated:
 * unlike a page, an API route returns 401 rather than redirecting. The body is
 * safe domain data only (SyncHealth) — never env, keys or error stacks.
 */
export async function GET(): Promise<Response> {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session?.user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const { db } = getDb();
  const health = await loadSyncHealth(db);
  return Response.json(health);
}
