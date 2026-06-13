import { test, expect } from "vitest";
import { Money, DEFAULT_CURRENCY } from "./index";

test("@upshot/core barrel exposes Money and DEFAULT_CURRENCY", () => {
  expect(DEFAULT_CURRENCY).toBe("AUD");
  expect(Money.fromCents(0).currency).toBe("AUD");
});
