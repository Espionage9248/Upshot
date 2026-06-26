import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const dismissMock = vi.fn();
const saveMock = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/server-actions/recurring", () => ({
  dismissSuggestionAction: (...args: unknown[]) => { dismissMock(...args); return Promise.resolve(); },
}));
vi.mock("@/server-actions/rules", () => ({
  saveRuleAction: (...args: unknown[]) => { saveMock(...args); return Promise.resolve({ ok: true as const, data: { ok: true as const } }); },
}));

import { DebtRuleLinkDialog } from "./debt-rule-link-dialog";

const opts = { categoryOptions: [], tagOptions: [], debtOptions: [{ value: "d1", label: "Zip" }], recurringOptions: [], installmentOptions: [] };

beforeEach(() => { dismissMock.mockClear(); saveMock.mockClear(); });

describe("DebtRuleLinkDialog", () => {
  it("opens the rule editor seeded with the debt name and a condition", async () => {
    render(
      <DebtRuleLinkDialog
        debtId="d1" debtName="Zip" seedDescription="Zip"
        trigger={<button>Link payment</button>} {...opts}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Link payment" }));
    await waitFor(() => expect(screen.getByLabelText("Rule name")).toBeInTheDocument());
    expect((screen.getByLabelText("Rule name") as HTMLInputElement).value).toBe("Debt payments: Zip");
    expect(screen.getAllByTestId("condition-row")).toHaveLength(1);
  });

  it("dismisses the suggestion on Save (not on Cancel) when a suggestionId is present", async () => {
    render(
      <DebtRuleLinkDialog
        debtId="d1" debtName="Zip" seedDescription="Zip" suggestionId="sugg-1"
        trigger={<button>Link payment</button>} {...opts}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Link payment" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument());
    // Cancel does NOT dismiss.
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(dismissMock).not.toHaveBeenCalled();
    // Re-open and Save → dismiss fires once with the suggestionId.
    fireEvent.click(screen.getByRole("button", { name: "Link payment" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(saveMock).toHaveBeenCalled());
    expect(dismissMock).toHaveBeenCalledWith("sugg-1");
  });
});
