import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { passkey } from "@better-auth/passkey";
import { schema } from "@upshot/db";
import { getDb } from "./db";
import { assertValidRpId } from "./rp-id";

/**
 * Read a required env var, throwing a clear, secret-free error if it is missing.
 * The error names the variable but never echoes a value.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set; refusing to start auth without it`);
  }
  return value;
}

function buildAuth() {
  const BETTER_AUTH_SECRET = requireEnv("BETTER_AUTH_SECRET");
  const BETTER_AUTH_URL = requireEnv("BETTER_AUTH_URL");
  const UPSHOT_RP_ID = requireEnv("UPSHOT_RP_ID");

  // Fail fast if the RP-ID does not match the auth URL host.
  // (rpID + hostname are not secrets; the error may include them.)
  assertValidRpId(UPSHOT_RP_ID, BETTER_AUTH_URL);

  return betterAuth({
    secret: BETTER_AUTH_SECRET,
    baseURL: BETTER_AUTH_URL,
    database: drizzleAdapter(getDb().db, { provider: "sqlite", schema }),
    plugins: [
      passkey({
        rpID: UPSHOT_RP_ID,
        rpName: "Upshot",
        origin: BETTER_AUTH_URL,
      }),
    ],
    trustedOrigins: [BETTER_AUTH_URL],
  });
}

// Inferred (concrete) auth type — annotating with ReturnType<typeof betterAuth>
// would widen to Auth<BetterAuthOptions>, which the concrete instance is not
// assignable to.
type AuthInstance = ReturnType<typeof buildAuth>;

let cached: AuthInstance | undefined;

/**
 * Build once and return the better-auth instance.
 *
 * Construction is deferred to first use — NOT module load — so importing this
 * module is side-effect-free. `next build` imports route modules to collect page
 * data; eager construction here would force it to require runtime secrets and a
 * decryptable DB at build time (which, in the Docker build → runtime-injected-env
 * deployment, are absent). Instead the encrypted DB and secrets are only touched
 * when auth is actually used, and the config is validated fail-fast at that first
 * use (and reused thereafter).
 */
export function getAuth(): AuthInstance {
  return (cached ??= buildAuth());
}
