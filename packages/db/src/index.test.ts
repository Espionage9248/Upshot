import { test, expect } from "vitest";
import { packageName } from "./index";

test("@upshot/db barrel exposes its package name", () => {
  expect(packageName).toBe("@upshot/db");
});
