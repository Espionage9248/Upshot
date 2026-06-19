import { withRetry, type RetryOptions } from "./retry";
import {
  UpAuthError, UpHttpError,
  type UpAccountResource, type UpCategoryResource, type UpClientPort,
  type UpListResponse, type UpTransactionResource,
} from "./types";

export interface UpClientOptions {
  token: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  retry?: RetryOptions;
}

const DEFAULT_BASE_URL = "https://api.up.com.au/api/v1";

export class UpClient implements UpClientPort {
  private readonly token: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly retry: RetryOptions;

  constructor(opts: UpClientOptions) {
    this.token = opts.token;
    this.baseUrl = opts.baseUrl ?? DEFAULT_BASE_URL;
    this.fetchImpl = opts.fetchImpl ?? ((input, init) => fetch(input, init));
    this.retry = opts.retry ?? {};
  }

  async ping(): Promise<void> {
    await this.getJson<unknown>("/util/ping");
  }

  async listAccounts(): Promise<UpAccountResource[]> {
    const body = await this.getJson<UpListResponse<UpAccountResource>>("/accounts");
    return body.data;
  }

  async listCategories(): Promise<UpCategoryResource[]> {
    const body = await this.getJson<UpListResponse<UpCategoryResource>>("/categories");
    return body.data;
  }

  async listTransactions(opts?: { since?: string }): Promise<UpTransactionResource[]> {
    const params = new URLSearchParams({ "page[size]": "100" });
    if (opts?.since) params.set("filter[since]", opts.since);
    let next: string | null = `/transactions?${params.toString()}`;
    const out: UpTransactionResource[] = [];
    const seen = new Set<string>();
    while (next) {
      if (seen.has(next)) break; // defensive: a self-referential links.next would loop forever
      seen.add(next);
      const body: UpListResponse<UpTransactionResource> =
        await this.getJson<UpListResponse<UpTransactionResource>>(next);
      out.push(...body.data);
      next = body.links.next;
    }
    return out;
  }

  async addTag(transactionId: string, tagId: string): Promise<void> {
    await this.send("POST", `/transactions/${transactionId}/relationships/tags`, {
      data: [{ type: "tags", id: tagId }],
    });
  }

  async setCategory(transactionId: string, categoryId: string | null): Promise<void> {
    await this.send("PATCH", `/transactions/${transactionId}/relationships/category`,
      { data: categoryId ? { type: "categories", id: categoryId } : null });
  }

  /**
   * Resolve a request target. Up's `links.next` is an absolute URL → pass it
   * through. A relative path is appended to baseUrl verbatim so the base's path
   * prefix (e.g. /api/v1) is preserved — `new URL("/x", base)` would drop it.
   */
  private resolve(pathOrUrl: string): string {
    return /^https?:\/\//i.test(pathOrUrl) ? pathOrUrl : `${this.baseUrl}${pathOrUrl}`;
  }

  private getJson<T>(pathOrUrl: string): Promise<T> {
    return withRetry<T>(
      async () => {
        const res = await this.fetchImpl(this.resolve(pathOrUrl), {
          headers: { Authorization: `Bearer ${this.token}`, Accept: "application/json" },
        });
        return (await this.handle(res, pathOrUrl)) as T;
      },
      isRetryable,
      retryAfterOf,
      this.retry,
    );
  }

  private send(method: string, path: string, payload: unknown): Promise<void> {
    return withRetry<void>(
      async () => {
        const res = await this.fetchImpl(this.resolve(path), {
          method,
          headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        await this.handle(res, path);
      },
      isRetryable,
      retryAfterOf,
      this.retry,
    );
  }

  /** Returns parsed JSON on 2xx (or undefined for 204); throws a classified error otherwise. */
  private async handle(res: Response, pathOrUrl: string): Promise<unknown> {
    const path = pathOf(pathOrUrl);
    if (res.status === 401 || res.status === 403) throw new UpAuthError(res.status, path);
    if (!res.ok) {
      throw new UpHttpError(res.status, path, `Up API error ${res.status}`, retryAfterMs(res));
    }
    if (res.status === 204) return undefined;
    return res.json();
  }
}

function pathOf(pathOrUrl: string): string {
  try {
    return new URL(pathOrUrl).pathname; // absolute URL → strip host + query
  } catch {
    return pathOrUrl.split("?")[0]!; // already a path
  }
}

function retryAfterMs(res: Response): number | undefined {
  const header = res.headers.get("retry-after");
  if (header === null) return undefined;
  const seconds = Number(header);
  return Number.isFinite(seconds) ? seconds * 1000 : undefined;
}

function retryAfterOf(err: unknown): number | null {
  return err instanceof UpHttpError && err.retryAfterMs !== undefined ? err.retryAfterMs : null;
}

function isRetryable(err: unknown): boolean {
  if (err instanceof UpAuthError) return false;
  if (err instanceof UpHttpError) return err.status === 429 || err.status >= 500;
  return err instanceof TypeError; // fetch() throws TypeError on a network-level failure
}
