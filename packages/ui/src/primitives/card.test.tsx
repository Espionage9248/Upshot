import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Card, CardHeader, CardTitle, CardBody } from "./card";

describe("Card", () => {
  it("renders children and carries surface + elevation classes", () => {
    const { container } = render(<Card>Content</Card>);
    const el = container.firstChild as HTMLElement;
    expect(el).toBeInTheDocument();
    expect(el.className).toContain("bg-[var(--surface)]");
    expect(el.className).toContain("shadow-[var(--elev-1)]");
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("CardTitle renders the eyebrow text", () => {
    render(<CardTitle>SAFE TO SPEND</CardTitle>);
    expect(screen.getByText("SAFE TO SPEND")).toBeInTheDocument();
  });

  it("className merges on Card", () => {
    const { container } = render(<Card className="extra-class">hi</Card>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("extra-class");
    expect(el.className).toContain("bg-[var(--surface)]");
  });

  it("CardHeader + CardBody render children", () => {
    render(
      <Card>
        <CardHeader><CardTitle>Title</CardTitle></CardHeader>
        <CardBody>Body content</CardBody>
      </Card>,
    );
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Body content")).toBeInTheDocument();
  });
});
