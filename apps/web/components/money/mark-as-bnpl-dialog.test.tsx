import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MarkAsBnplDialog } from "./mark-as-bnpl-dialog";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const createInstallmentFromTransactionAction = vi.fn();

vi.mock("@/server-actions/installments", () => ({
  createInstallmentFromTransactionAction: (...a: unknown[]) =>
    createInstallmentFromTransactionAction(...a),
}));

function openDialog() {
  render(
    <MarkAsBnplDialog
      txId="tx-abc"
      txDate="2026-06-15"
      amountCents={-5000}
      description="Afterpay – ACME"
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: /mark as bnpl/i }));
}

describe("MarkAsBnplDialog", () => {
  beforeEach(() => {
    createInstallmentFromTransactionAction.mockReset();
  });

  it("renders the per-installment amount as read-only (not an editable Input)", () => {
    openDialog();
    // The amount is displayed via <Money>, not an editable input.
    // Confirm no input with an amount value is present.
    const inputs = screen.queryAllByRole("textbox");
    // Only the merchant field should be an editable textbox.
    for (const input of inputs) {
      expect(input).not.toHaveAttribute("data-money-amount");
      // None of the textboxes should contain the raw amount value "50.00" as editable.
      expect(input).not.toHaveValue("50.00");
      expect(input).not.toHaveValue("5000");
      expect(input).not.toHaveValue("-5000");
      expect(input).not.toHaveValue("-50.00");
    }
    // The amount label should be visible as a display element.
    expect(screen.getByText(/per-installment amount/i)).toBeInTheDocument();
  });

  it("defaults totalInstallments input to 4", () => {
    openDialog();
    expect(screen.getByRole("spinbutton", { name: /number of installments/i })).toHaveValue(4);
  });

  it("starts the paid stepper at 1", () => {
    openDialog();
    // The stepper value is displayed in a non-interactive element.
    const stepperValue = screen.getByTestId("paid-value");
    expect(stepperValue).toHaveTextContent("1");
  });

  it("clicking + raises paid from 1 to 2", () => {
    openDialog();
    fireEvent.click(screen.getByRole("button", { name: /increase installments paid/i }));
    expect(screen.getByTestId("paid-value")).toHaveTextContent("2");
  });

  it("clicking Add plan after +1 calls the action with correct args", async () => {
    createInstallmentFromTransactionAction.mockResolvedValue({ ok: true, data: { ok: true, planId: "plan-1" } });
    openDialog();
    // Increment paid to 2.
    fireEvent.click(screen.getByRole("button", { name: /increase installments paid/i }));
    fireEvent.click(screen.getByRole("button", { name: /add plan/i }));
    await waitFor(() => {
      expect(createInstallmentFromTransactionAction).toHaveBeenCalledWith({
        transactionId: "tx-abc",
        txDate: "2026-06-15",
        merchant: "Afterpay – ACME",
        installmentCents: 5000,
        totalInstallments: 4,
        installmentsPaid: 2,
      });
    });
  });

  it("surfaces the friendly error when the transaction is already linked (double-wrapped domain failure)", async () => {
    createInstallmentFromTransactionAction.mockResolvedValue({
      ok: true,
      data: { ok: false, error: "This transaction is already linked to a BNPL plan." },
    });
    openDialog();
    fireEvent.click(screen.getByRole("button", { name: /add plan/i }));

    // The friendly error is shown as a form-level alert.
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/already linked to a BNPL plan/i);
    });
    // And the dialog did NOT close (success path not taken): the dialog
    // description (only rendered inside the open DialogContent) is still present.
    expect(screen.getByText(/buy-now-pay-later installment plan/i)).toBeInTheDocument();
  });
});
