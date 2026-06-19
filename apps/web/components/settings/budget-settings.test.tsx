import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BudgetSettings } from "./budget-settings";

const setSaverGoalAction = vi.fn();

vi.mock("@/server-actions/savers", () => ({
  setSaverGoalAction: (...a: unknown[]) => setSaverGoalAction(...a),
}));

const SAVERS = [
  { id: "s1", name: "Holiday Fund", goalTargetCents: null, goalTargetDate: null },
  { id: "s2", name: "New Car", goalTargetCents: 500000, goalTargetDate: "2026-12-31" },
];

describe("BudgetSettings", () => {
  beforeEach(() => {
    setSaverGoalAction.mockReset();
  });

  it("submits a goal with integer cents + the date string", async () => {
    setSaverGoalAction.mockResolvedValue({ ok: true, data: undefined });
    render(<BudgetSettings savers={SAVERS} />);

    fireEvent.change(screen.getByLabelText(/Holiday Fund target amount/i), {
      target: { value: "1234.56" },
    });
    fireEvent.change(screen.getByLabelText(/Holiday Fund target date/i), {
      target: { value: "2027-06-30" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save Holiday Fund/i }));

    await waitFor(() => {
      expect(setSaverGoalAction).toHaveBeenCalledWith("s1", 123456, "2027-06-30");
    });
  });

  it("clears the goal when both fields are empty", async () => {
    setSaverGoalAction.mockResolvedValue({ ok: true, data: undefined });
    render(<BudgetSettings savers={SAVERS} />);

    fireEvent.change(screen.getByLabelText(/New Car target amount/i), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByLabelText(/New Car target date/i), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save New Car/i }));

    await waitFor(() => {
      expect(setSaverGoalAction).toHaveBeenCalledWith("s2", null, null);
    });
  });

  it("shows an error and does not call the action when only the amount is filled", async () => {
    setSaverGoalAction.mockResolvedValue({ ok: true, data: undefined });
    render(<BudgetSettings savers={SAVERS} />);

    fireEvent.change(screen.getByLabelText(/Holiday Fund target amount/i), {
      target: { value: "1000.00" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save Holiday Fund/i }));

    await waitFor(() => {
      expect(screen.getByText(/Enter both a target amount and date, or clear both/i)).toBeTruthy();
    });
    expect(setSaverGoalAction).not.toHaveBeenCalled();
  });
});
