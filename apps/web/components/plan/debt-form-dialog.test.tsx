import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, test, expect, describe } from "vitest";
import type { DebtRow } from "@/app/(app)/plan/debts/data";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const updateMock = vi.fn<(input: unknown) => Promise<{ ok: true; data: undefined }>>(
  async () => ({ ok: true as const, data: undefined }),
);
vi.mock("@/server-actions/debts", () => ({
  createDebtAction: vi.fn(async () => ({ ok: true as const, data: "debt-1" })),
  updateDebtAction: (input: unknown) => updateMock(input),
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

const debt: DebtRow = {
  id: "d1",
  name: "Zip",
  type: "BNPL",
  currentBalanceCents: 10000,
  originalBalanceCents: null,
  creditLimitCents: null,
  monthlyPaymentCents: 5000,
  minimumPaymentCents: null,
  interestRate: null,
  monthlyFeeCents: null,
  feeDueDay: null,
  lastFeeAppliedAt: null,
  payoffPriority: 999,
  includeInSnowball: true,
  includeInNetWorth: true,
  matchRuleId: null,
  paymentsLinkedAt: null,
  accountNumber: null,
  institutionName: null,
  notes: null,
  estimatedPayoffDate: null,
  monthsRemaining: null,
  totalInterestProjectedCents: null,
};

describe("DebtFormDialog edit mode", () => {
  test("pre-populates and calls updateDebtAction with the edited balance", async () => {
    updateMock.mockClear();
    render(<DebtFormDialog initialValues={debt} trigger={<button>Edit</button>} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    const balance = screen.getByLabelText("Current balance") as HTMLInputElement;
    expect(balance.value).toBe("100.00");
    fireEvent.change(balance, { target: { value: "250.00" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ id: "d1", currentBalanceCents: 25000 }),
      );
    });
  });
});
