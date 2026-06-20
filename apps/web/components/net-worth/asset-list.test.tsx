import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AssetList } from "./asset-list";
import type { AssetRow } from "@/app/(app)/net-worth/data";

const deleteAssetAction = vi.fn();

vi.mock("@/server-actions/assets", () => ({
  deleteAssetAction: (...args: unknown[]) => deleteAssetAction(...args),
  createAssetAction: vi.fn(),
  updateAssetAction: vi.fn(),
  recordValuationAction: vi.fn(),
}));

// next/navigation router.refresh is called after a successful delete.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const ASSETS: AssetRow[] = [
  {
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
  },
];

const TYPE_OPTIONS = [{ value: "SUPER", label: "Super" }];

describe("AssetList", () => {
  beforeEach(() => {
    deleteAssetAction.mockReset();
  });

  it("renders a row per asset with name and value", () => {
    render(<AssetList assets={ASSETS} typeOptions={TYPE_OPTIONS} />);
    expect(screen.getByText("Super Fund")).toBeInTheDocument();
    expect(screen.getByText(/\$28,200/)).toBeInTheDocument();
  });

  it("calls deleteAssetAction with the asset id on delete", async () => {
    deleteAssetAction.mockResolvedValue({ ok: true, data: undefined });
    render(<AssetList assets={ASSETS} typeOptions={TYPE_OPTIONS} />);
    fireEvent.click(screen.getByRole("button", { name: /delete super fund/i }));
    await waitFor(() => {
      expect(deleteAssetAction).toHaveBeenCalledWith("a1");
    });
  });

  it("renders an EmptyState when there are no assets", () => {
    render(<AssetList assets={[]} typeOptions={TYPE_OPTIONS} />);
    expect(screen.getByText(/no assets yet/i)).toBeInTheDocument();
  });
});
