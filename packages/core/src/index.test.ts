import { test, expect } from "vitest";
import { packageName } from "./index";

test("@upshot/core barrel exposes its package name", () => {
  expect(packageName).toBe("@upshot/core");
});
