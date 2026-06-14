import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { vitestPreset } from "@upshot/config/vitest";

// Mirror the tsconfig `@/*` path alias so test files can import app modules the
// same way source does (e.g. `@/lib/backup-codes`).
const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  // The app tsconfig uses jsx:"preserve" for Next, which Vite's own esbuild
  // cannot transform. plugin-react owns the JSX/TSX transform for the test build
  // (it does not affect `next build`, which uses Next's compiler + real tsconfig).
  plugins: [react()],
  resolve: {
    alias: { "@": rootDir },
  },
  test: {
    ...vitestPreset.test,
    include: [
      "lib/**/*.test.ts",
      "lib/**/*.test.tsx",
      "components/**/*.test.tsx",
      "server-actions/**/*.test.ts",
      "app/**/*.test.ts",
    ],
    // Component tests render React, so the web suite needs a DOM. jsdom is a
    // superset for the pure (node-fine) lib/server-action tests, so this is safe.
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
});
