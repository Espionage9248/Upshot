import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AllocateDialog } from "./allocate-dialog";

const setAllocationAction = vi.fn();

// "use server" action — stub so the component test never touches the DB/auth.
vi.mock("@/server-actions/budget", () => ({
  setAllocationAction: (...args: unknown[]) => setAllocationAction(...args),
}));

function open() {
  render(
    <AllocateDialog accountId="acc-groceries" accountName="Groceries" month="2026-06" currentCents={60000} />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Allocate" }));
}

describe("AllocateDialog", () => {
  beforeEach(() => {
    setAllocationAction.mockReset();
  });

  it("opens with the current allocation prefilled (dollars)", () => {
    open();
    const input = screen.getByLabelText("Amount") as HTMLInputElement;
    expect(input.value).toBe("600.00");
  });

  it("submits the entered amount in integer cents", async () => {
    setAllocationAction.mockResolvedValue({ ok: true, data: { ok: true } });
    open();
    const input = screen.getByLabelText("Amount");
    fireEvent.change(input, { target: { value: "750" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(setAllocationAction).toHaveBeenCalledWith("acc-groceries", "2026-06", 75000);
    });
  });

  it("renders the ActionResult error path", async () => {
    setAllocationAction.mockResolvedValue({
      ok: false,
      error: { code: "internal", message: "Something went wrong." },
    });
    open();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
    });
  });

  it("rejects an invalid amount before calling the action", async () => {
    open();
    fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "abc" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(screen.getByText("Enter a valid amount.")).toBeInTheDocument();
    });
    expect(setAllocationAction).not.toHaveBeenCalled();
  });
});
