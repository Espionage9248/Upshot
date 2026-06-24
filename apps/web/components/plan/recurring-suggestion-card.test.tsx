import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/server-actions/recurring", () => ({
  acceptSuggestionAction: vi.fn(),
  dismissSuggestionAction: vi.fn(),
}));
vi.mock("@/server-actions/debts", () => ({
  linkDebtPaymentToDebtAction: vi.fn().mockResolvedValue({ ok: true, data: "rule-1" }),
}));

import { RecurringSuggestionCard } from "./recurring-suggestion-card";

const row = {
  id: "s1",
  name: "ZIP PAYMENT",
  category: null,
  kind: "BILL" as const,
  frequency: "MONTHLY" as const,
  amountCents: 5000,
  usageCount: 0,
  status: "SUGGESTED" as const,
  merchant: null,
  lastAmountCents: null,
  priceLastChangedAt: null,
  usageResetAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("RecurringSuggestionCard", () => {
  it("renders accept and dismiss buttons", () => {
    render(<RecurringSuggestionCard row={row as never} debtChoices={[]} />);
    expect(screen.getByRole("button", { name: /Accept/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Dismiss/i })).toBeInTheDocument();
  });

  it("renders debt picker when debtChoices is non-empty", () => {
    render(
      <RecurringSuggestionCard
        row={row as never}
        debtChoices={[{ id: "zip", name: "Zip" }]}
      />,
    );
    expect(screen.getByLabelText("Choose a debt")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Link payment/i })).toBeInTheDocument();
  });

  it("omits debt picker when debtChoices is empty", () => {
    render(<RecurringSuggestionCard row={row as never} debtChoices={[]} />);
    expect(screen.queryByLabelText("Choose a debt")).not.toBeInTheDocument();
  });
});
