import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TaxSettings } from "./tax-settings";

const updateTaxSettingsAction = vi.fn();

vi.mock("@/server-actions/settings", () => ({
  updateTaxSettingsAction: (...a: unknown[]) => updateTaxSettingsAction(...a),
}));

describe("TaxSettings", () => {
  beforeEach(() => {
    updateTaxSettingsAction.mockReset();
  });

  it("submits the new FY start month", async () => {
    updateTaxSettingsAction.mockResolvedValue({ ok: true, data: undefined });
    render(<TaxSettings financialYearStartMonth={7} medicareLevyApplies={true} />);

    // Drive the native FY-month select (the test uses a native <select> path).
    fireEvent.change(screen.getByLabelText(/financial year/i), {
      target: { value: "1" },
    });

    await waitFor(() => {
      expect(updateTaxSettingsAction).toHaveBeenCalledWith({
        financialYearStartMonth: 1,
        medicareLevyApplies: true,
      });
    });
  });

  it("submits the toggled Medicare levy flag", async () => {
    updateTaxSettingsAction.mockResolvedValue({ ok: true, data: undefined });
    render(<TaxSettings financialYearStartMonth={7} medicareLevyApplies={true} />);

    fireEvent.click(screen.getByRole("switch", { name: /medicare levy/i }));

    await waitFor(() => {
      expect(updateTaxSettingsAction).toHaveBeenCalledWith({
        financialYearStartMonth: 7,
        medicareLevyApplies: false,
      });
    });
  });
});
