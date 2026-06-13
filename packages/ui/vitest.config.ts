import { defineConfig } from "vitest/config";
import { vitestPreset } from "@upshot/config/vitest";

export default defineConfig({
  test: {
    ...vitestPreset.test,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
});
