import type { ReactNode } from "react";
import { getDb } from "@/lib/db";
import { SyncActivityView } from "@/components/settings/sync-activity-view";
import { loadSyncActivity } from "./data";

// Reads the encrypted DB at request time (getDb → createDbClientFromEnv throws
// without DB_ENCRYPTION_KEY), so this route must never be statically prerendered.
export const dynamic = "force-dynamic";

export default async function SyncActivityPage(): Promise<ReactNode> {
  const { db } = getDb();
  const data = await loadSyncActivity(db);

  return <SyncActivityView data={data} />;
}
