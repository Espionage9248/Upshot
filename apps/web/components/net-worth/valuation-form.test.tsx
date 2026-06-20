import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ValuationForm } from "./valuation-form";
import type { AssetRow } from "@/app/(app)/net-worth/data";

const recordValuationAction = vi.fn();

vi.mock("@/server-actions/assets", () => ({
  recordValuationAction: (...args: unknown[]) => recordValuationAction(...args),
}));

// app router is not mounted in jsdom; the form calls router.refresh() on success.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const ASSET: AssetRow = {
  id: "a1",
  name: "Super Fund",
  type: "SUPER",
  valueCents: 2820000,
  institution: "AustralianSuper",
  notes: null,
  includeInNetWorth: true,
  lastValuedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function open() {
  render(<ValuationForm asset={ASSET} />);
  fireEvent.click(screen.getByRole("button", { name: /record valuation for super fund/i }));
}

describe("ValuationForm", () => {
  beforeEach(() => {
    recordValuationAction.mockReset();
  });

  it("submits assetId + integer cents + valuedAt", async () => {
    recordValuationAction.mockResolvedValue({ ok: true, data: undefined });
    open();
    fireEvent.change(screen.getByLabelText(/new value/i), { target: { value: "9800" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => {
      expect(recordValuationAction).toHaveBeenCalledTimes(1);
    });
    const call = recordValuationAction.mock.calls[0]!;
    expect(call[0]).toBe("a1");
    expect(call[1]).toBe(980000);
    expect(typeof call[2]).toBe("string");
    expect(call[2]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("rejects an invalid amount before calling the action", async () => {
    open();
    fireEvent.change(screen.getByLabelText(/new value/i), { target: { value: "abc" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => {
      expect(screen.getByText(/valid amount/i)).toBeInTheDocument();
    });
    expect(recordValuationAction).not.toHaveBeenCalled();
  });

  it("renders the ActionResult error path", async () => {
    recordValuationAction.mockResolvedValue({
      ok: false,
      error: { code: "internal", message: "Something went wrong." },
    });
    open();
    fireEvent.change(screen.getByLabelText(/new value/i), { target: { value: "100" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => {
      expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
    });
  });
});
