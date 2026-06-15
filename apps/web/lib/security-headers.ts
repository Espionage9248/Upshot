/**
 * Single source of truth for the app's security headers (Task 25). Pure strings
 * only — no env, DB, or node APIs — so it is safe to import into the EDGE
 * middleware as well as the (node) test.
 *
 * The headers live in two homes for a reason. A locked-down `script-src 'self'`
 * CANNOT be a static next.config header: Next's App Router streams its OWN inline
 * RSC/flight scripts (`self.__next_f.push(...)`), which a static policy would
 * either block or force open with `'unsafe-inline'`. So:
 *   - the STATIC, request-independent headers live in `SECURITY_HEADERS` (and are
 *     mirrored in next.config.mjs, which is JS and runs before TS compile);
 *   - the CSP is built per-request in middleware via `buildCsp(nonce)`, and Next
 *     applies that same nonce to its own inline scripts when it sees the nonce in
 *     the request's Content-Security-Policy header.
 */

/**
 * Permissions-Policy: disable features we never use, and explicitly allow
 * WebAuthn (`publickey-credentials-get=(self)`) so passkey ceremonies work.
 * Removing that token would break passkey sign-in.
 */
const PERMISSIONS_POLICY = [
  "camera=()",
  "microphone=()",
  "geolocation=()",
  "payment=()",
  "usb=()",
  "publickey-credentials-get=(self)",
].join(", ");

/**
 * Static, always-on headers (NO CSP — that is per-request, see `buildCsp`).
 *
 * HSTS is included unconditionally: browsers ignore it over plain HTTP, so it is
 * harmless in dev and only takes effect once served over HTTPS (prod, behind the
 * reverse proxy). Keeping it constant also keeps this list stable for the test.
 */
export const SECURITY_HEADERS: { key: string; value: string }[] = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: PERMISSIONS_POLICY },
];

/**
 * Build the locked-down CSP for a single request, carrying the per-request
 * `nonce`. Next applies this nonce to its inline scripts; our inline theme
 * bootstrap (app/layout.tsx) reads the nonce from the `x-nonce` request header.
 */
export function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    // 'strict-dynamic' lets the nonce'd Next loader pull its chunks; 'self' is a
    // fallback for older browsers that ignore strict-dynamic.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    // next/font + Tailwind inject inline <style>; style injection is low XSS
    // risk, and 'unsafe-inline' here is the standard Next compromise.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}
