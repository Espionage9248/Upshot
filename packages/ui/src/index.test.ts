import { test, expect } from "vitest";
import { packageName } from "./index";

test("@upshot/ui barrel exposes its package name", () => {
  expect(packageName).toBe("@upshot/ui");
});
