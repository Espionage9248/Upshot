import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("renders the title", () => {
    const { getByText } = render(<EmptyState title="No transactions yet" />);
    expect(getByText("No transactions yet")).toBeTruthy();
  });

  it("renders hint when provided", () => {
    const { getByText } = render(
      <EmptyState
        title="No transactions"
        hint="They'll appear here after your next sync."
      />,
    );
    expect(getByText("They'll appear here after your next sync.")).toBeTruthy();
  });

  it("renders action when provided", () => {
    const { getByText } = render(
      <EmptyState title="No data" action={<button>Sync now</button>} />,
    );
    expect(getByText("Sync now")).toBeTruthy();
  });

  it("has dashed border class", () => {
    const { container } = render(<EmptyState title="Empty" />);
    const el = container.firstChild as HTMLElement;
    // border-dashed or border-style dashed in class or style
    const hasDashedClass =
      el.className.includes("border-dashed") ||
      el.style.borderStyle === "dashed";
    expect(hasDashedClass).toBe(true);
  });

  it("renders icon SVG when icon prop is provided", () => {
    const { container } = render(<EmptyState title="No data" icon="bell" />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("renders without icon without crashing", () => {
    const { container } = render(<EmptyState title="Empty" />);
    expect(container.firstChild).toBeTruthy();
  });
});
