import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth";

// Build the handlers lazily so importing this route module is side-effect-free
// (see getAuth) — this is what lets `next build` collect page data without the
// runtime auth env. getAuth() is memoized, so this resolves once per process.
let handlers: ReturnType<typeof toNextJsHandler> | undefined;
function authHandlers() {
  return (handlers ??= toNextJsHandler(getAuth()));
}

export function GET(request: Request) {
  return authHandlers().GET(request);
}

export function POST(request: Request) {
  return authHandlers().POST(request);
}
