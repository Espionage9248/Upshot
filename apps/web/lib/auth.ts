import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { passkey } from "@better-auth/passkey";
import { createDbClientFromEnv, schema } from "@upshot/db";

// Minimal config — enough to describe the better-auth table set to the Drizzle
// adapter. Full auth configuration (secrets, trusted origins, session policy,
// route wiring) is added in a later task. Importing this module constructs the
// encrypted DB client, so it requires DB_ENCRYPTION_KEY at load time.
export const auth = betterAuth({
  database: drizzleAdapter(createDbClientFromEnv().db, { provider: "sqlite", schema }),
  plugins: [passkey()],
});
