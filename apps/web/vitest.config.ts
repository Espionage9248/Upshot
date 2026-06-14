import { defineConfig } from "vitest/config";
import { vitestPreset } from "@upshot/config/vitest";

export default defineConfig({
  test: { ...vitestPreset.test, include: ["lib/**/*.test.ts"] },
});
