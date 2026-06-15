import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders a button with its label", () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("loading sets aria-busy, disables, and shows a spinner", () => {
    const { container } = render(<Button loading>Save</Button>);
    const b = screen.getByRole("button");
    expect(b).toHaveAttribute("aria-busy", "true");
    expect(b).toBeDisabled();
    expect(container.querySelector(".animate-spin")).toBeTruthy();
  });

  it("loading disables even when disabled={false} is passed explicitly", () => {
    render(
      <Button loading disabled={false}>
        Save
      </Button>,
    );
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("applies variant + size classes", () => {
    const { rerender } = render(<Button variant="primary" size="lg">Go</Button>);
    const b = screen.getByRole("button");
    expect(b.className).toMatch(/coral/); // primary uses coral fill
    rerender(<Button variant="secondary" size="sm">Go</Button>);
    expect(screen.getByRole("button").className).toMatch(/surface-2|line/);
  });

  it("icon-only forwards aria-label", () => {
    render(<Button aria-label="Add" leadingIcon="plus" />);
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
  });
});
