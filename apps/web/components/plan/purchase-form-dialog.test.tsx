import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PurchaseFormDialog } from "./purchase-form-dialog";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const createPurchaseAction = vi.fn();
const updatePurchaseAction = vi.fn();
const scrapePurchaseUrlAction = vi.fn();

vi.mock("@/server-actions/purchases", () => ({
  createPurchaseAction: (...a: unknown[]) => createPurchaseAction(...a),
  updatePurchaseAction: (...a: unknown[]) => updatePurchaseAction(...a),
  scrapePurchaseUrlAction: (...a: unknown[]) => scrapePurchaseUrlAction(...a),
}));

function openDialog() {
  render(<PurchaseFormDialog />);
  fireEvent.click(screen.getByRole("button", { name: /add to wishlist/i }));
}

describe("PurchaseFormDialog", () => {
  beforeEach(() => {
    createPurchaseAction.mockReset();
    updatePurchaseAction.mockReset();
    scrapePurchaseUrlAction.mockReset();
  });

  it("Fetch from URL pre-fills name and price (non-destructive)", async () => {
    scrapePurchaseUrlAction.mockResolvedValue({
      ok: true,
      data: { name: "Sony WH", priceCents: 29900 },
    });
    createPurchaseAction.mockResolvedValue({ ok: true, data: "id-1" });

    openDialog();

    // Type a URL
    fireEvent.change(screen.getByLabelText(/URL/i), {
      target: { value: "https://example.com/product" },
    });

    // Click Fetch from URL
    fireEvent.click(screen.getByRole("button", { name: /fetch from url/i }));

    // Name fills to "Sony WH"
    await waitFor(() => {
      expect(screen.getByLabelText(/^Name/i)).toHaveValue("Sony WH");
    });

    // Price fills to "299.00"
    expect(screen.getByLabelText(/target price/i)).toHaveValue("299.00");
  });

  it("edit mode prefills fields and calls updatePurchaseAction with the merged row", async () => {
    updatePurchaseAction.mockResolvedValue({ ok: true });
    const purchase = {
      id: "p-1",
      customName: "Sony WH",
      status: "WISHLIST" as const,
      transactionId: null,
      priceCents: null,
      currency: "AUD",
      merchant: null,
      category: "Tech",
      purchaseDate: null,
      targetDate: "2026-12-01",
      targetPriceCents: 29900,
      priority: 2,
      url: null,
      notes: "black only",
      saveMonthlyCents: null,
    };

    render(<PurchaseFormDialog purchase={purchase} />);
    fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));

    // Prefilled
    expect(screen.getByLabelText(/^Name/i)).toHaveValue("Sony WH");
    expect(screen.getByLabelText(/target price/i)).toHaveValue("299.00");
    expect(screen.getByLabelText(/category/i)).toHaveValue("Tech");

    fireEvent.change(screen.getByLabelText(/^Name/i), { target: { value: "Sony WH XM5" } });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(updatePurchaseAction).toHaveBeenCalledTimes(1);
    });
    const arg = updatePurchaseAction.mock.calls[0]![0];
    expect(arg).toMatchObject({ id: "p-1", customName: "Sony WH XM5", category: "Tech", targetPriceCents: 29900 });
  });

  it("shows name error when submitting with empty name", async () => {
    openDialog();

    // Submit without filling name
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));

    await waitFor(() => {
      expect(screen.getByText(/enter a name/i)).toBeInTheDocument();
    });

    expect(createPurchaseAction).not.toHaveBeenCalled();
  });
});
