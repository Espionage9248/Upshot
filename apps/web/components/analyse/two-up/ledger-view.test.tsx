import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LedgerView } from "./ledger-view";
import type { TwoUpTxn } from "@upshot/core";

vi.mock("@/server-actions/two-up", () => ({
  updateTwoUpAttributionAction: vi.fn(async () => ({ ok: true, data: undefined })),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

// jsdom lacks hasPointerCapture and scrollIntoView which Radix Select uses internally.
beforeEach(() => {
  if (!window.HTMLElement.prototype.hasPointerCapture) {
    window.HTMLElement.prototype.hasPointerCapture = () => false;
  }
  if (!window.HTMLElement.prototype.scrollIntoView) {
    window.HTMLElement.prototype.scrollIntoView = () => {};
  }
});

const txns: TwoUpTxn[] = [
  {
    id: "t1",
    rowHash: "rh1",
    date: "2024-03-10",
    description: "Coles",
    amountCents: -5000,
    owner: "JAMES",
    category: "Groceries",
  },
  {
    id: "t2",
    rowHash: "rh2",
    date: "2024-03-11",
    description: "Salary",
    amountCents: 300000,
    owner: "BRITTNEY",
    category: null,
  },
  {
    id: "t3",
    rowHash: "rh3",
    date: "2024-03-12",
    description: "Netflix",
    amountCents: -1500,
    owner: "SHARED",
    category: "Entertainment",
  },
];

describe("LedgerView", () => {
  it("renders all transactions initially", () => {
    render(<LedgerView txns={txns} />);
    expect(screen.getByText("Coles")).toBeInTheDocument();
    expect(screen.getByText("Salary")).toBeInTheDocument();
    expect(screen.getByText("Netflix")).toBeInTheDocument();
  });

  it("person filter narrows visible rows to JAMES only", () => {
    render(<LedgerView txns={txns} />);

    // Open the Person FilterChip (first combobox in the toolbar)
    const comboboxes = screen.getAllByRole("combobox");
    fireEvent.click(comboboxes[0]!);
    // "James" appears in both the TUpRow owner label and the FilterChip option;
    // pick the option element rendered inside the Select listbox.
    const options = screen.getAllByText("James");
    // The listbox option is an li[role="option"]; the row span has role=none.
    const chipOption = options.find(
      (el) => el.closest('[role="option"]') !== null,
    );
    fireEvent.click(chipOption!);

    expect(screen.getByText("Coles")).toBeInTheDocument();
    expect(screen.queryByText("Salary")).not.toBeInTheDocument();
    expect(screen.queryByText("Netflix")).not.toBeInTheDocument();
  });

  it("search input narrows visible rows by description", () => {
    render(<LedgerView txns={txns} />);

    const searchInput = screen.getByRole("searchbox");
    fireEvent.change(searchInput, { target: { value: "Netflix" } });

    expect(screen.queryByText("Coles")).not.toBeInTheDocument();
    expect(screen.queryByText("Salary")).not.toBeInTheDocument();
    expect(screen.getByText("Netflix")).toBeInTheDocument();
  });

  it("renders the back to overview link", () => {
    render(<LedgerView txns={txns} />);
    expect(screen.getByRole("link", { name: /back to overview/i })).toBeInTheDocument();
  });
});
