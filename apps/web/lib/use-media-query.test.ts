import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useMediaQuery } from "./use-media-query";

describe("useMediaQuery", () => {
  it("returns the defaultValue when matchMedia reports no match", () => {
    const { result } = renderHook(() => useMediaQuery("(min-width: 640px)", true));
    // after mount the mocked matchMedia.matches === false
    expect(result.current).toBe(false);
  });

  it("reflects a matching query after mount", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
      media: "(min-width: 640px)",
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    } as unknown as MediaQueryList);
    const { result } = renderHook(() => useMediaQuery("(min-width: 640px)", false));
    expect(result.current).toBe(true);
  });
});
