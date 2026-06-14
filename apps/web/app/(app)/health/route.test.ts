import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createDbClient,
  applyMigrations,
  seed,
  DrizzleJobRunRepo,
  type DbClient,
} from "@upshot/db";

// next/headers throws outside a request scope; the route only forwards the
// result to getSession (which we mock), so a no-op header bag is enough.
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

const getSession = vi.fn();
vi.mock("@/lib/auth", () => ({ getAuth: () => ({ api: { getSession } }) }));

const getDb = vi.fn();
vi.mock("@/lib/db", () => ({ getDb: () => getDb() }));

const KEY = "0123456789abcdef0123456789abcdef";
const dirs: string[] = [];

function freshDb(): DbClient {
  const dir = mkdtempSync(join(tmpdir(), "upshot-health-route-"));
  dirs.push(dir);
  const { db } = createDbClient({ url: join(dir, "x.db"), key: KEY });
  applyMigrations(db as DbClient);
  seed(db as DbClient);
  return db as DbClient;
}

async function seedFailed401(db: DbClient): Promise<void> {
  const jr = new DrizzleJobRunRepo(db);
  await jr.create({ id: "j1", job: "SYNC", startedAt: "2026-06-13T09:00:00.000Z" });
  await jr.finish("j1", {
    status: "FAILED",
    finishedAt: "2026-06-13T09:00:05.000Z",
    cursor: null,
    counts: null,
    error: "Up API auth failed (HTTP 401)",
  });
}

beforeEach(() => {
  getSession.mockReset();
  getDb.mockReset();
});

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

describe("GET /health", () => {
  it("returns 401 and no data when unauthenticated", async () => {
    getSession.mockResolvedValue(null);
    const { GET } = await import("./route");

    const res = await GET();

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "unauthorized" });
    // Never touched the DB, so no health/secret could leak.
    expect(getDb).not.toHaveBeenCalled();
  });

  it("returns 200 with the real SyncHealth when authenticated", async () => {
    const db = freshDb();
    await seedFailed401(db);
    getSession.mockResolvedValue({ user: { id: "u1" } });
    getDb.mockReturnValue({ db });
    const { GET } = await import("./route");

    const res = await GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.lastStatus).toBe("FAILED");
    expect(body.tokenHealthy).toBe(false);
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain(KEY);
    expect(serialized).not.toContain("DB_ENCRYPTION_KEY");
  });
});
