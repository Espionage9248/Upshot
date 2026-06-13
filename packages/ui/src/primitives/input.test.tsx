import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Input } from "./input";

describe("Input", () => {
  it("renders label text and associates it with the control", () => {
    render(<Input label="Email" />);
    expect(screen.getByText("Email")).toBeInTheDocument();
    // getByLabelText confirms the label→input association
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("error prop sets aria-invalid and renders the error message", () => {
    render(<Input label="Amount" error="Required" />);
    const input = screen.getByLabelText("Amount");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Required")).toBeInTheDocument();
  });

  it("mono prop applies font-mono and text-right classes", () => {
    render(<Input label="Amount" mono />);
    const input = screen.getByLabelText("Amount");
    expect(input.className).toMatch(/font-mono/);
    expect(input.className).toMatch(/text-right/);
  });

  it("disabled prop disables the control", () => {
    render(<Input label="Name" disabled />);
    expect(screen.getByLabelText("Name")).toBeDisabled();
  });
});
