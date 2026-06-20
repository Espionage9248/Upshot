import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TransferDialog } from "./transfer-dialog";

const transferAllocationAction = vi.fn();

vi.mock("@/server-actions/budget", () => ({
  transferAllocationAction: (...args: unknown[]) => transferAllocationAction(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

function open() {
  render(
    <TransferDialog
      month="2026-06"
      fromAccountId="acc-groceries"
      fromAccountName="Groceries"
      destinations={[{ id: "acc-emergency", name: "Emergency Fund" }]}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Move" }));
}

describe("TransferDialog", () => {
  beforeEach(() => {
    transferAllocationAction.mockReset();
  });

  it("submits a positive amount in integer cents to the chosen destination", async () => {
    transferAllocationAction.mockResolvedValue({ ok: true, data: { ok: true } });
    open();
    fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "40" } });
    // first dialog "Move" is the trigger; the submit button is the second
    const moveButtons = screen.getAllByRole("button", { name: "Move" });
    fireEvent.click(moveButtons[moveButtons.length - 1]!);
    await waitFor(() => {
      expect(transferAllocationAction).toHaveBeenCalledWith(
        "acc-groceries",
        "acc-emergency",
        "2026-06",
        4000,
      );
    });
  });

  it("renders the overdraw ActionResult error path", async () => {
    transferAllocationAction.mockResolvedValue({ ok: true, data: { ok: false, code: "overdraw" } });
    open();
    fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "999" } });
    const moveButtons = screen.getAllByRole("button", { name: "Move" });
    fireEvent.click(moveButtons[moveButtons.length - 1]!);
    await waitFor(() => {
      expect(screen.getByText(/not enough allocation/i)).toBeInTheDocument();
    });
  });

  it("renders the generic ActionResult error path (unauthorized/internal)", async () => {
    transferAllocationAction.mockResolvedValue({
      ok: false,
      error: { code: "unauthorized", message: "You must be signed in." },
    });
    open();
    fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "10" } });
    const moveButtons = screen.getAllByRole("button", { name: "Move" });
    fireEvent.click(moveButtons[moveButtons.length - 1]!);
    await waitFor(() => {
      expect(screen.getByText("You must be signed in.")).toBeInTheDocument();
    });
  });

  it("rejects a non-positive amount before calling the action", async () => {
    open();
    fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "0" } });
    const moveButtons = screen.getAllByRole("button", { name: "Move" });
    fireEvent.click(moveButtons[moveButtons.length - 1]!);
    await waitFor(() => {
      expect(screen.getByText("Enter a valid amount.")).toBeInTheDocument();
    });
    expect(transferAllocationAction).not.toHaveBeenCalled();
  });
});
