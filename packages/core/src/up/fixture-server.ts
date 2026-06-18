import { createServer, type Server } from "node:http";

export interface FixtureResponse {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
}

export interface FixtureServer {
  url: string; // e.g. http://127.0.0.1:54123
  requests: Array<{ method: string; path: string; authorization: string | undefined; body?: unknown }>;
  close: () => Promise<void>;
}

/**
 * A loopback HTTP server that replays canned Up JSON:API responses.
 * Routes are keyed "GET /path?query". A route may be a single response or an
 * array consumed in order (for e.g. 429-then-200). Unmatched routes → 404.
 */
export async function startFixtureServer(
  routes: Record<string, FixtureResponse | FixtureResponse[]>,
): Promise<FixtureServer> {
  const queues = new Map<string, FixtureResponse[]>(
    Object.entries(routes).map(([k, v]) => [k, Array.isArray(v) ? [...v] : [v]]),
  );
  const requests: FixtureServer["requests"] = [];

  const server: Server = createServer((req, res) => {
    const key = `${req.method} ${req.url}`;
    const chunks: Buffer[] = [];
    req.on("error", (err) => res.destroy(err));
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      let body: unknown;
      if (raw.length > 0) {
        try { body = JSON.parse(raw); } catch { body = raw; }
      }
      requests.push({
        method: req.method ?? "",
        path: req.url ?? "",
        authorization: req.headers.authorization,
        body,
      });
      const queue = queues.get(key);
      const next = queue && queue.length > 1 ? queue.shift()! : queue?.[0];
      if (!next) {
        res.writeHead(404, { "content-type": "application/json" });
        res.end(JSON.stringify({ errors: [{ status: "404", title: "no fixture", detail: key }] }));
        return;
      }
      res.writeHead(next.status ?? 200, { "content-type": "application/json", ...next.headers });
      res.end(JSON.stringify(next.body ?? {}));
    });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("fixture server has no port");
  return {
    url: `http://127.0.0.1:${address.port}`,
    requests,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}
