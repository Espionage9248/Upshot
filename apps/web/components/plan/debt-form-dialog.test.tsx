import { render, screen, fireEvent } from "@testing-library/react";
import { vi, test, expect } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/server-actions/debts", () => ({
  createDebtAction: vi.fn(async () => ({ ok: true as const, data: "debt-1" })),
}));

import { DebtFormDialog } from "./debt-form-dialog";

function openDialog() {
  render(<DebtFormDialog />);
  fireEvent.click(screen.getByRole("button", { name: "Add debt" }));
}

test("shows per-field error under Name when name is empty", async () => {
  openDialog();
  // Click the submit button (also labelled "Add debt" inside the dialog)
  const buttons = screen.getAllByRole("button", { name: "Add debt" });
  // The dialog trigger is the first; the submit is inside the dialog content
  const submitBtn = buttons.at(-1)!;
  fireEvent.click(submitBtn);

  expect(screen.getByText("Enter a name for this debt.")).toBeInTheDocument();
});

test("name-empty error is associated with the Name input, not the interest-rate input", async () => {
  openDialog();
  const buttons = screen.getAllByRole("button", { name: "Add debt" });
  const submitBtn = buttons.at(-1)!;
  fireEvent.click(submitBtn);

  const errorEl = screen.getByText("Enter a name for this debt.");
  const errorId = errorEl.id;

  // The interest-rate input must NOT reference this error's id in aria-describedby
  const rateInput = screen.getByRole("textbox", { name: /interest rate/i });
  const describedBy = rateInput.getAttribute("aria-describedby") ?? "";
  expect(describedBy).not.toContain(errorId);

  // Conversely, the Name input MUST reference this error's id
  const nameInput = screen.getByRole("textbox", { name: /^Name$/i });
  const nameDescribedBy = nameInput.getAttribute("aria-describedby") ?? "";
  expect(nameDescribedBy).toContain(errorId);
});
