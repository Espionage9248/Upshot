import { render, screen, fireEvent } from "@testing-library/react";
import { vi, test, expect } from "vitest";
import { Disclosure, SeedHint, MoneyInput, PlannerLabel, addMonths, labelMonth, diffMonths } from "./planner-atoms";

test("Disclosure: shows summary when closed, children when open, toggles", () => {
  const onToggle = vi.fn();
  const { rerender } = render(
    <Disclosure title="Income" summary="$4,960/mo" open={false} onToggle={onToggle}>
      <div>BODY</div>
    </Disclosure>,
  );
  expect(screen.getByText("$4,960/mo")).toBeInTheDocument();
  expect(screen.queryByText("BODY")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Income/ }));
  expect(onToggle).toHaveBeenCalledTimes(1);
  rerender(
    <Disclosure title="Income" summary="$4,960/mo" open onToggle={onToggle}>
      <div>BODY</div>
    </Disclosure>,
  );
  expect(screen.getByText("BODY")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Income/ })).toHaveAttribute("aria-expanded", "true");
});

test("SeedHint renders italic estimate copy", () => {
  render(<SeedHint>detected from salary</SeedHint>);
  expect(screen.getByText("detected from salary")).toBeInTheDocument();
});

test("MoneyInput: shows dollar value, emits integer cents via the guard (no parseFloat)", () => {
  const onCents = vi.fn();
  render(<MoneyInput valueCents={496000} onCents={onCents} aria-label="Base income" />);
  const input = screen.getByLabelText("Base income") as HTMLInputElement;
  expect(input.value).toBe("4,960");
  fireEvent.change(input, { target: { value: "5000.50" } });
  expect(onCents).toHaveBeenLastCalledWith(500050);
  // invalid → 0 (guard rejects)
  fireEvent.change(input, { target: { value: "12.999" } });
  expect(onCents).toHaveBeenLastCalledWith(0);
});

test("PlannerLabel renders an uppercase eyebrow", () => {
  render(<PlannerLabel>If you commit to this</PlannerLabel>);
  expect(screen.getByText("If you commit to this")).toBeInTheDocument();
});

test("month helpers", () => {
  expect(addMonths("2026-06", 3)).toBe("2026-09");
  expect(addMonths("2026-11", 2)).toBe("2027-01");
  expect(labelMonth("2026-06")).toMatch(/Jun '26/);
  expect(diffMonths("2026-06", "2027-06")).toBe(12);
});
