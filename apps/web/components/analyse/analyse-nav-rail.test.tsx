import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnalyseNavRail } from "./analyse-nav-rail";

vi.mock("next/navigation", () => ({ usePathname: () => "/analyse/2up" }));

describe("AnalyseNavRail", () => {
  it("renders a 2Up entry pointing at /analyse/2up", () => {
    render(<AnalyseNavRail />);
    const link = screen.getByRole("link", { name: "2Up" });
    expect(link).toHaveAttribute("href", "/analyse/2up");
    expect(link).toHaveAttribute("aria-current", "page");
  });
});
