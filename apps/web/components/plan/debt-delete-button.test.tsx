import { render, screen, fireEvent } from "@testing-library/react";
import { vi, test, expect, beforeEach } from "vitest";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock }) }));
vi.mock("@/server-actions/debts", () => ({
  deleteDebtAction: vi.fn(async () => ({ ok: true as const, data: undefined })),
}));

import { DebtDeleteButton } from "./debt-delete-button";
import { deleteDebtAction } from "@/server-actions/debts";

const mockDeleteDebtAction = vi.mocked(deleteDebtAction);

beforeEach(() => {
  vi.clearAllMocks();
});

test("renders a Delete debt button", () => {
  render(<DebtDeleteButton debtId="d1" debtName="Visa" />);
  expect(screen.getByRole("button", { name: "Delete debt" })).toBeInTheDocument();
});

test("prompts for confirmation before deleting", () => {
  const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
  render(<DebtDeleteButton debtId="d1" debtName="Visa" />);
  fireEvent.click(screen.getByRole("button", { name: "Delete debt" }));
  expect(confirmSpy).toHaveBeenCalledWith('Delete "Visa"? This cannot be undone.');
  expect(mockDeleteDebtAction).not.toHaveBeenCalled();
  confirmSpy.mockRestore();
});

test("calls deleteDebtAction and navigates to /plan/debts on confirm", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  render(<DebtDeleteButton debtId="d1" debtName="Visa" />);
  fireEvent.click(screen.getByRole("button", { name: "Delete debt" }));
  await vi.waitFor(() => expect(mockDeleteDebtAction).toHaveBeenCalledWith("d1"));
  await vi.waitFor(() => expect(pushMock).toHaveBeenCalledWith("/plan/debts"));
});
