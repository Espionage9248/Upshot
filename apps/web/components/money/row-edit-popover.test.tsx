import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RowEditPopover } from "./row-edit-popover";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/server-actions/installments", () => ({
  createInstallmentFromTransactionAction: vi.fn(),
}));

const setCategoryAction = vi.fn();
const setTagsAction = vi.fn();
const markSalaryAction = vi.fn();
const markTransferAction = vi.fn();
const markTaxDeductibleAction = vi.fn();

vi.mock("@/server-actions/money", () => ({
  setCategoryAction: (...a: unknown[]) => setCategoryAction(...a),
  setTagsAction: (...a: unknown[]) => setTagsAction(...a),
  markSalaryAction: (...a: unknown[]) => markSalaryAction(...a),
  markTransferAction: (...a: unknown[]) => markTransferAction(...a),
  markTaxDeductibleAction: (...a: unknown[]) => markTaxDeductibleAction(...a),
}));

function open(props?: Partial<Parameters<typeof RowEditPopover>[0]>) {
  render(
    <RowEditPopover
      txId="tx-1"
      categoryId="cat-groceries"
      categoryOptions={[
        { value: "cat-groceries", label: "Groceries" },
        { value: "cat-fun", label: "Fun" },
      ]}
      tagOptions={[{ value: "tag-work", label: "tag-work" }]}
      activeTagIds={[]}
      isSalary={false}
      isTransfer={false}
      isTaxDeductible={false}
      amountCents={-1000}
      description="Test Merchant"
      txDate="2026-06-15"
      {...props}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: /edit/i }));
}

describe("RowEditPopover", () => {
  beforeEach(() => {
    setCategoryAction.mockReset();
    setTagsAction.mockReset();
    markSalaryAction.mockReset();
    markTransferAction.mockReset();
    markTaxDeductibleAction.mockReset();
  });

  it("calls setCategoryAction when a new category is chosen", async () => {
    setCategoryAction.mockResolvedValue({ ok: true, data: {} });
    open();
    fireEvent.click(screen.getByRole("button", { name: "Fun" }));
    await waitFor(() => {
      expect(setCategoryAction).toHaveBeenCalledWith("tx-1", "cat-fun");
    });
  });

  it("calls setTagsAction when a tag is added", async () => {
    setTagsAction.mockResolvedValue({ ok: true, data: {} });
    open();
    fireEvent.click(screen.getByRole("button", { name: "tag-work" }));
    await waitFor(() => {
      expect(setTagsAction).toHaveBeenCalledWith("tx-1", ["tag-work"], []);
    });
  });

  it("renders the non-fatal warning path when the action returns a warning", async () => {
    setCategoryAction.mockResolvedValue({
      ok: true,
      data: { warning: { code: "up_writeback_failed", message: "Category saved locally but could not be pushed to Up." } },
    });
    open();
    fireEvent.click(screen.getByRole("button", { name: "Fun" }));
    await waitFor(() => {
      expect(screen.getByText(/Saved locally/i)).toBeInTheDocument();
    });
  });

  it("renders the error path when the action fails", async () => {
    setCategoryAction.mockResolvedValue({
      ok: false,
      error: { code: "internal", message: "Something went wrong." },
    });
    open();
    fireEvent.click(screen.getByRole("button", { name: "Fun" }));
    await waitFor(() => {
      expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
    });
  });

  it("calls markSalaryAction when the salary flag is toggled", async () => {
    markSalaryAction.mockResolvedValue({ ok: true, data: undefined });
    open();
    fireEvent.click(screen.getByRole("button", { name: /mark salary/i }));
    await waitFor(() => {
      expect(markSalaryAction).toHaveBeenCalledWith("tx-1", true);
    });
  });
});
