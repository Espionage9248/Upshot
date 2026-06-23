import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, test, expect } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/server-actions/installments", () => ({
  createInstallmentByMatchAction: vi.fn(async () => ({
    ok: true as const,
    data: { id: "x", matched: 2 },
  })),
}));

import { InstallmentFormDialog } from "./installment-form-dialog";
import { createInstallmentByMatchAction } from "@/server-actions/installments";

function openDialog() {
  render(<InstallmentFormDialog />);
  fireEvent.click(screen.getByRole("button", { name: "Add BNPL plan" }));
}

test("calls createInstallmentByMatchAction with correct args on valid submit", async () => {
  openDialog();

  fireEvent.change(screen.getByRole("textbox", { name: /merchant/i }), {
    target: { value: "Klarna – ACME" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: /per-installment amount/i }), {
    target: { value: "25.00" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: /number of installments/i }), {
    target: { value: "4" },
  });

  fireEvent.click(screen.getByRole("button", { name: "Add plan" }));

  await waitFor(() => {
    expect(createInstallmentByMatchAction).toHaveBeenCalledWith({
      merchant: "Klarna – ACME",
      installmentCents: 2500,
      totalInstallments: 4,
    });
  });
});

test("shows merchant error under the merchant field when merchant is empty", async () => {
  openDialog();

  // Leave merchant empty; fill other fields so they don't block
  fireEvent.change(screen.getByLabelText(/per-installment amount/i), {
    target: { value: "25.00" },
  });

  fireEvent.click(screen.getByRole("button", { name: "Add plan" }));

  const errorEl = screen.getByText("Enter the merchant name.");
  expect(errorEl).toBeInTheDocument();

  // Confirm error is associated with the merchant input (aria-describedby)
  const merchantInput = screen.getByRole("textbox", { name: /merchant/i });
  const errorId = errorEl.id;
  if (errorId) {
    const describedBy = merchantInput.getAttribute("aria-describedby") ?? "";
    expect(describedBy).toContain(errorId);
  }
});

test("there is NO Frequency (days) input in the document (regression guard)", () => {
  openDialog();
  expect(screen.queryByLabelText(/frequency.*days/i)).toBeNull();
  expect(screen.queryByRole("textbox", { name: /frequency/i })).toBeNull();
});
