import { test, expect } from "vitest";
import { packageName } from "./index";

test("@upshot/contracts barrel exposes its package name", () => {
  expect(packageName).toBe("@upshot/contracts");
});
