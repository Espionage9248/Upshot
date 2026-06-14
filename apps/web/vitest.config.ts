import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { vitestPreset } from "@upshot/config/vitest";

// Mirror the tsconfig `@/*` path alias so test files can import app modules the
// same way source does (e.g. `@/lib/backup-codes`).
const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: { "@": rootDir },
  },
  test: {
    ...vitestPreset.test,
    include: ["lib/**/*.test.ts", "server-actions/**/*.test.ts"],
  },
});
