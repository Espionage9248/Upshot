import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { ThemeToggle } from "./theme-toggle";

// matchMedia is not implemented in jsdom; stub it so the System case resolves.
vi.stubGlobal(
  "matchMedia",
  vi.fn(() => ({ matches: false })),
);

afterEach(() => {
  document.cookie = "upshot-theme=; path=/; max-age=0";
  document.documentElement.classList.remove("dark");
});

describe("ThemeToggle", () => {
  it("renders a labelled button reflecting the current preference", () => {
    const { getByRole } = render(<ThemeToggle initial="system" />);
    expect(getByRole("button", { name: /theme:\s*system/i })).toBeTruthy();
  });

  it("cycles system -> light -> dark on click and persists the cookie", () => {
    const { getByRole } = render(<ThemeToggle initial="system" />);
    const btn = getByRole("button");

    fireEvent.click(btn); // -> light
    expect(btn.getAttribute("aria-label")).toMatch(/light/i);
    expect(document.cookie).toContain("upshot-theme=light");

    fireEvent.click(btn); // -> dark
    expect(btn.getAttribute("aria-label")).toMatch(/dark/i);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
