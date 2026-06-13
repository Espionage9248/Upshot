import { describe, it, expect } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("joins truthy classes and drops falsy", () => {
    const falsy = false as boolean;
    expect(cn("a", falsy && "b", "c")).toBe("a c");
  });
  it("dedupes conflicting tailwind classes (last wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
