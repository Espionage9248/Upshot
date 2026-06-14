import { describe, expect, it } from "vitest";
import { resolveTheme, nextTheme, THEME_COOKIE } from "./theme";

describe("THEME_COOKIE", () => {
  it("is the stable cookie name", () => {
    expect(THEME_COOKIE).toBe("upshot-theme");
  });
});

describe("resolveTheme", () => {
  it("'light' resolves to light regardless of prefersDark", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("light", false)).toBe("light");
  });

  it("'dark' resolves to dark regardless of prefersDark", () => {
    expect(resolveTheme("dark", true)).toBe("dark");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("'system' follows prefersDark", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });

  it("undefined follows prefersDark", () => {
    expect(resolveTheme(undefined, true)).toBe("dark");
    expect(resolveTheme(undefined, false)).toBe("light");
  });

  it("unknown string follows prefersDark", () => {
    expect(resolveTheme("garbage", true)).toBe("dark");
    expect(resolveTheme("garbage", false)).toBe("light");
  });
});

describe("nextTheme", () => {
  it("cycles system -> light -> dark -> system", () => {
    expect(nextTheme("system")).toBe("light");
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("system");
  });

  it("undefined or unknown begins the cycle at light", () => {
    expect(nextTheme(undefined)).toBe("light");
    expect(nextTheme("garbage")).toBe("light");
  });
});
