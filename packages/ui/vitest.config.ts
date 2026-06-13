import { defineConfig } from "vitest/config";
import { vitestPreset } from "@upshot/config/vitest";

export default defineConfig({
  test: {
    ...vitestPreset.test,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
});
