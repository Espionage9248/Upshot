import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Badge } from "./badge";

describe("Badge", () => {
  it("renders its content", () => {
    render(<Badge tone="saved">Saver</Badge>);
    expect(screen.getByText("Saver")).toBeInTheDocument();
  });

  it("applies tone styling", () => {
    const { container } = render(<Badge tone="expense">Overspent</Badge>);
    // tone drives a fill+border derived from --expense via inline style
    const el = container.firstChild as HTMLElement;
    expect(el).toBeTruthy();
    expect(el.style.background).toContain("var(--expense)");
    expect(el.style.background).toContain("13%");
    expect(el.style.borderColor).toContain("var(--expense)");
    expect(el.style.borderColor).toContain("26%");
  });
});
