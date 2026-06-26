import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/server-actions/recurring", () => ({
  acceptSuggestionAction: vi.fn(),
  dismissSuggestionAction: vi.fn(),
}));
vi.mock("@/server-actions/rules", () => ({ saveRuleAction: vi.fn() }));

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

const ruleOptions = { categoryOptions: [], tagOptions: [], debtOptions: [], recurringOptions: [], installmentOptions: [] };

describe("RecurringSuggestionCard", () => {
  it("renders accept and dismiss buttons", () => {
    render(<RecurringSuggestionCard row={row as never} debtChoices={[]} ruleOptions={ruleOptions} />);
    expect(screen.getByRole("button", { name: /Accept/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Dismiss/i })).toBeInTheDocument();
  });

  it("renders the debt-link trigger when debtChoices is non-empty", () => {
    render(
      <RecurringSuggestionCard
        row={row as never}
        debtChoices={[{ id: "zip", name: "Zip" }]}
        ruleOptions={ruleOptions}
      />,
    );
    expect(screen.getByRole("button", { name: /link.*to a debt/i })).toBeInTheDocument();
  });

  it("omits the debt-link trigger when debtChoices is empty", () => {
    render(<RecurringSuggestionCard row={row as never} debtChoices={[]} ruleOptions={ruleOptions} />);
    expect(screen.queryByRole("button", { name: /link.*to a debt/i })).not.toBeInTheDocument();
  });
});
