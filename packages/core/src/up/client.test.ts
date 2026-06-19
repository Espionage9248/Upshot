import { describe, it, expect, afterEach } from "vitest";
import { UpClient } from "./client";
import { UpAuthError, UpHttpError } from "./types";
import { startFixtureServer, type FixtureServer } from "./fixture-server";

let server: FixtureServer;
afterEach(() => server?.close());

const noSleep = { sleep: () => Promise.resolve(), random: () => 0, baseDelayMs: 1 };

describe("UpClient", () => {
  it("ping resolves on 200 and sends the bearer token", async () => {
    server = await startFixtureServer({ "GET /util/ping": { body: { meta: { id: "x" } } } });
    const client = new UpClient({ token: "tok-123", baseUrl: server.url, retry: noSleep });
    await expect(client.ping()).resolves.toBeUndefined();
    expect(server.requests[0]?.authorization).toBe("Bearer tok-123");
  });

  it("ping throws UpAuthError on 401 (no retry)", async () => {
    server = await startFixtureServer({ "GET /util/ping": { status: 401, body: { errors: [] } } });
    const client = new UpClient({ token: "tok", baseUrl: server.url, retry: noSleep });
    await expect(client.ping()).rejects.toBeInstanceOf(UpAuthError);
    expect(server.requests).toHaveLength(1); // not retried
  });

  it("listAccounts returns mapped resources", async () => {
    server = await startFixtureServer({
      "GET /accounts": { body: { data: [{ type: "accounts", id: "a1" }], links: { prev: null, next: null } } },
    });
    const client = new UpClient({ token: "t", baseUrl: server.url, retry: noSleep });
    const accounts = await client.listAccounts();
    expect(accounts.map((a) => a.id)).toEqual(["a1"]);
  });

  it("listTransactions follows links.next across pages and sends page[size] + filter[since]", async () => {
    server = await startFixtureServer({
      "GET /transactions?page%5Bsize%5D=100&filter%5Bsince%5D=2026-06-01T00%3A00%3A00.000Z": {
        body: { data: [{ type: "transactions", id: "t1" }], links: { prev: null, next: "/transactions?page%5Bafter%5D=abc" } },
      },
      "GET /transactions?page%5Bafter%5D=abc": {
        body: { data: [{ type: "transactions", id: "t2" }], links: { prev: null, next: null } },
      },
    });
    const client = new UpClient({ token: "t", baseUrl: server.url, retry: noSleep });
    const txns = await client.listTransactions({ since: "2026-06-01T00:00:00.000Z" });
    expect(txns.map((t) => t.id)).toEqual(["t1", "t2"]);
  });

  it("retries a 429 (honouring Retry-After) then succeeds", async () => {
    server = await startFixtureServer({
      "GET /accounts": [
        { status: 429, headers: { "retry-after": "0" }, body: { errors: [] } },
        { body: { data: [{ type: "accounts", id: "a1" }], links: { prev: null, next: null } } },
      ],
    });
    const client = new UpClient({ token: "t", baseUrl: server.url, retry: noSleep });
    const accounts = await client.listAccounts();
    expect(accounts.map((a) => a.id)).toEqual(["a1"]);
    expect(server.requests).toHaveLength(2);
  });

  it("retries a 500 then throws UpHttpError after maxAttempts", async () => {
    server = await startFixtureServer({ "GET /accounts": { status: 500, body: { errors: [] } } });
    const client = new UpClient({ token: "t", baseUrl: server.url, retry: { ...noSleep, maxAttempts: 3 } });
    const err = await client.listAccounts().catch((e) => e);
    expect(err).toBeInstanceOf(UpHttpError);
    expect(err.status).toBe(500);
    expect(err.path).toBe("/accounts"); // path only — no token, no host
    expect(server.requests).toHaveLength(3);
  });

  it("addTag POSTs the tag relationship", async () => {
    server = await startFixtureServer({ "POST /transactions/t1/relationships/tags": { status: 204 } });
    const client = new UpClient({ token: "t", baseUrl: server.url, retry: noSleep });
    await expect(client.addTag("t1", "Groceries")).resolves.toBeUndefined();
    expect(server.requests[0]?.method).toBe("POST");
  });

  it("preserves a base URL path prefix (e.g. /api/v1) on every request", async () => {
    server = await startFixtureServer({
      "GET /api/v1/accounts": { body: { data: [{ type: "accounts", id: "a1" }], links: { prev: null, next: null } } },
    });
    const client = new UpClient({ token: "t", baseUrl: `${server.url}/api/v1`, retry: noSleep });
    const accounts = await client.listAccounts();
    expect(accounts.map((a) => a.id)).toEqual(["a1"]);
    expect(server.requests[0]?.path).toBe("/api/v1/accounts");
  });

  it("uses the global fetch when no fetchImpl is injected", async () => {
    server = await startFixtureServer({ "GET /util/ping": { body: { meta: {} } } });
    const client = new UpClient({ token: "t", baseUrl: server.url, retry: noSleep }); // no fetchImpl
    await expect(client.ping()).resolves.toBeUndefined(); // exercises the default fetch wrapper
  });

  it("setCategory PATCHes the category relationship", async () => {
    server = await startFixtureServer({ "PATCH /transactions/t1/relationships/category": { status: 204 } });
    const client = new UpClient({ token: "t", baseUrl: server.url, retry: noSleep });
    await expect(client.setCategory("t1", "groceries")).resolves.toBeUndefined();
    expect(server.requests[0]?.method).toBe("PATCH");
    expect(server.requests[0]?.path).toBe("/transactions/t1/relationships/category");
    expect(server.requests[0]?.body).toEqual({ data: { type: "categories", id: "groceries" } });
  });

  it("setCategory(null) clears the category", async () => {
    server = await startFixtureServer({ "PATCH /transactions/t1/relationships/category": { status: 204 } });
    const client = new UpClient({ token: "t", baseUrl: server.url, retry: noSleep });
    await expect(client.setCategory("t1", null)).resolves.toBeUndefined();
    expect(server.requests[0]?.body).toEqual({ data: null });
  });
});
