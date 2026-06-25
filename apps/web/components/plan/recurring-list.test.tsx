import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/server-actions/recurring", () => ({
  deleteRecurringAction: vi.fn(),
  setRecurringKindAction: vi.fn(),
}));

import { RecurringList } from "./recurring-list";
import type { RecurringData } from "@/app/(app)/plan/recurring/data";

const row1 = {
  id: "r1",
  name: "Netflix",
  category: "Entertainment",
  kind: "SUBSCRIPTION" as const,
  frequency: "MONTHLY" as const,
  amountCents: 1899,
  usageCount: 0,
  // Required RecurringRow fields with defaults
  status: "ACTIVE" as const,
  merchant: null,
  lastAmountCents: null,
  priceLastChangedAt: null,
  usageResetAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const row2 = {
  id: "r2",
  name: "Spotify",
  category: "Entertainment",
  kind: "SUBSCRIPTION" as const,
  frequency: "MONTHLY" as const,
  amountCents: 1199,
  usageCount: 0,
  status: "ACTIVE" as const,
  merchant: null,
  lastAmountCents: null,
  priceLastChangedAt: null,
  usageResetAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const ruleOptions = { categoryOptions: [], tagOptions: [], debtOptions: [], recurringOptions: [], installmentOptions: [] };

const data: RecurringData = {
  active: [row1, row2] as never,
  paused: [],
  suggested: [],
  monthlyTotalCents: 1899 + 1199,
  overlaps: [{ groupKey: "category:Entertainment", itemIds: ["r1", "r2"] }],
  driftAlerts: [],
  debtPayments: { count: 0, totalCents: 0 },
  debtChoices: [],
  ruleOptions,
};

describe("RecurringList", () => {
  it("A4: renders category text on the card", () => {
    render(<RecurringList data={data} />);
    const entertainmentInstances = screen.getAllByText("Entertainment");
    expect(entertainmentInstances.length).toBeGreaterThan(0);
  });

  it("A5: overlap alert renders item names as links with correct hrefs", () => {
    render(<RecurringList data={data} />);
    const netflixLink = screen.getByRole("link", { name: "Netflix" });
    expect(netflixLink).toHaveAttribute("href", "#recurring-r1");

    const spotifyLink = screen.getByRole("link", { name: "Spotify" });
    expect(spotifyLink).toHaveAttribute("href", "#recurring-r2");
  });

  it("each card has an id anchor matching #recurring-{id}", () => {
    const { container } = render(<RecurringList data={data} />);
    expect(container.querySelector("#recurring-r1")).not.toBeNull();
    expect(container.querySelector("#recurring-r2")).not.toBeNull();
  });

  it("renders a read-only Debt payments group when debt payments exist", () => {
    render(
      <RecurringList
        data={{
          active: [],
          paused: [],
          suggested: [],
          monthlyTotalCents: 0,
          overlaps: [],
          driftAlerts: [],
          debtPayments: { count: 2, totalCents: 13300 },
          debtChoices: [],
          ruleOptions,
        }}
      />,
    );
    expect(screen.getByText("Debt payments")).toBeInTheDocument();
    expect(screen.getByText(/2 debts/)).toBeInTheDocument();
    // $133.00
    expect(screen.getByText(/133/)).toBeInTheDocument();
    // managed-on-debt note, no edit affordance inside the group
    expect(screen.getByText(/Managed on each debt/i)).toBeInTheDocument();
  });

  it("omits the Debt payments group when count is zero", () => {
    render(
      <RecurringList
        data={{
          active: [],
          paused: [],
          suggested: [],
          monthlyTotalCents: 0,
          overlaps: [],
          driftAlerts: [],
          debtPayments: { count: 0, totalCents: 0 },
          debtChoices: [],
          ruleOptions,
        }}
      />,
    );
    expect(screen.queryByText("Debt payments")).not.toBeInTheDocument();
  });
});
