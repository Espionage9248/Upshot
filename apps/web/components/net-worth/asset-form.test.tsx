import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AssetForm } from "./asset-form";

const createAssetAction = vi.fn();
const updateAssetAction = vi.fn();

vi.mock("@/server-actions/assets", () => ({
  createAssetAction: (...args: unknown[]) => createAssetAction(...args),
  updateAssetAction: (...args: unknown[]) => updateAssetAction(...args),
}));

// app router is not mounted in jsdom; the form calls router.refresh() on success.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const TYPE_OPTIONS = [
  { value: "INVESTMENT", label: "Investment" },
  { value: "PROPERTY", label: "Property" },
];

function openCreate() {
  render(<AssetForm mode="create" typeOptions={TYPE_OPTIONS} />);
  fireEvent.click(screen.getByRole("button", { name: /add asset/i }));
}

describe("AssetForm", () => {
  beforeEach(() => {
    createAssetAction.mockReset();
    updateAssetAction.mockReset();
  });

  it("create: submits name + integer cents from the dollar field", async () => {
    createAssetAction.mockResolvedValue({ ok: true, data: "new-id" });
    openCreate();
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Shares" } });
    fireEvent.change(screen.getByLabelText(/value/i), { target: { value: "9800" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => {
      expect(createAssetAction).toHaveBeenCalledTimes(1);
    });
    const arg = createAssetAction.mock.calls[0]![0] as Record<string, unknown>;
    expect(arg.name).toBe("Shares");
    expect(arg.valueCents).toBe(980000);
  });

  it("create: rejects an invalid dollar amount before calling the action", async () => {
    openCreate();
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Shares" } });
    fireEvent.change(screen.getByLabelText(/value/i), { target: { value: "abc" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => {
      expect(screen.getByText(/valid amount/i)).toBeInTheDocument();
    });
    expect(createAssetAction).not.toHaveBeenCalled();
  });

  it("create: renders the ActionResult error path", async () => {
    createAssetAction.mockResolvedValue({
      ok: false,
      error: { code: "internal", message: "Something went wrong." },
    });
    openCreate();
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "X" } });
    fireEvent.change(screen.getByLabelText(/value/i), { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => {
      expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
    });
  });

  it("update: prefills the asset and submits the full row via updateAssetAction", async () => {
    updateAssetAction.mockResolvedValue({ ok: true, data: undefined });
    render(
      <AssetForm
        mode="update"
        typeOptions={TYPE_OPTIONS}
        asset={{
          id: "a1",
          name: "Car",
          type: "PROPERTY",
          valueCents: 1250000,
          institution: null,
          notes: null,
          includeInNetWorth: true,
          lastValuedAt: null,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /edit car/i }));
    const value = screen.getByLabelText(/value/i) as HTMLInputElement;
    expect(value.value).toBe("12500.00");
    fireEvent.change(value, { target: { value: "13000" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => {
      expect(updateAssetAction).toHaveBeenCalledTimes(1);
    });
    const arg = updateAssetAction.mock.calls[0]![0] as Record<string, unknown>;
    expect(arg.id).toBe("a1");
    expect(arg.valueCents).toBe(1300000);
  });
});
