/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static, always-on security headers (Task 25). The CSP is NOT here — it is
  // built per-request with a nonce in middleware.ts, because Next streams its own
  // inline scripts and a static locked-down script-src would block them.
  //
  // next.config.mjs is plain JS and runs in Node before TS compile, so it cannot
  // import lib/security-headers.ts. Keep this list in sync with the exported
  // SECURITY_HEADERS in lib/security-headers.ts (the test asserts over that one).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=(), publickey-credentials-get=(self)",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
