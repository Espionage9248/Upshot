import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Textarea } from "./textarea";

describe("Textarea", () => {
  it("renders label text and associates it with the control", () => {
    render(<Textarea label="Notes" />);
    expect(screen.getByText("Notes")).toBeInTheDocument();
    expect(screen.getByLabelText("Notes")).toBeInTheDocument();
  });

  it("error prop sets aria-invalid and renders the error message", () => {
    render(<Textarea label="Notes" error="Required" />);
    const textarea = screen.getByLabelText("Notes");
    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Required")).toBeInTheDocument();
  });

  it("disabled prop disables the control", () => {
    render(<Textarea label="Notes" disabled />);
    expect(screen.getByLabelText("Notes")).toBeDisabled();
  });
});
