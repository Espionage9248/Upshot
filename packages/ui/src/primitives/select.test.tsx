import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UiSelect } from "./select";

// jsdom lacks hasPointerCapture and scrollIntoView which Radix Select uses
// internally. Stub them minimally here so tests don't throw on open interaction.
beforeEach(() => {
  if (!window.HTMLElement.prototype.hasPointerCapture) {
    window.HTMLElement.prototype.hasPointerCapture = () => false;
  }
  if (!window.HTMLElement.prototype.scrollIntoView) {
    window.HTMLElement.prototype.scrollIntoView = () => {};
  }
});

const OPTIONS = [
  { value: "a", label: "Apple" },
  { value: "b", label: "Banana" },
];

describe("UiSelect", () => {
  it("renders the label and trigger with placeholder", () => {
    render(
      <UiSelect label="Fruit" placeholder="Pick one" options={OPTIONS} />,
    );
    expect(screen.getByText("Fruit")).toBeInTheDocument();
    expect(screen.getByText("Pick one")).toBeInTheDocument();
    // label htmlFor associates with the trigger's id
    expect(screen.getByLabelText("Fruit")).toBe(screen.getByRole("combobox"));
  });

  it("opens the content and shows options on trigger click", () => {
    render(
      <UiSelect label="Fruit" placeholder="Pick one" options={OPTIONS} />,
    );
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);
    // Radix renders content into a portal; options should be in the document
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("Banana")).toBeInTheDocument();
  });

  it("calls onValueChange when an option is selected", () => {
    const onValueChange = vi.fn();
    render(
      <UiSelect
        label="Fruit"
        placeholder="Pick one"
        options={OPTIONS}
        onValueChange={onValueChange}
      />,
    );
    fireEvent.click(screen.getByRole("combobox"));
    // After opening, select the first option
    const apple = screen.getByText("Apple");
    fireEvent.click(apple);
    expect(onValueChange).toHaveBeenCalledWith("a");
  });

  it("error prop renders the message and marks the trigger invalid", () => {
    render(
      <UiSelect
        label="Fruit"
        options={OPTIONS}
        error="Selection required"
      />,
    );
    expect(screen.getByText("Selection required")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveAttribute("aria-invalid", "true");
  });
});
