import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TUpRow } from "./tup-row";
import type { TwoUpTxn } from "@upshot/core";

vi.mock("@/server-actions/two-up", () => ({ updateTwoUpAttributionAction: vi.fn(async () => ({ ok: true, data: undefined })) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const expenseTxn: TwoUpTxn = {
  id: "txn-1",
  rowHash: "abc123",
  date: "2025-02-28",
  description: "Coles 4321",
  amountCents: -14230,
  owner: "JAMES",
  category: "Groceries",
};

const incomeTxn: TwoUpTxn = {
  id: "txn-2",
  rowHash: "def456",
  date: "2025-03-01",
  description: "Salary deposit",
  amountCents: 260000,
  owner: "BRITTNEY",
  category: null,
};

describe("TUpRow", () => {
  it("renders merchant name extracted from description", () => {
    render(<TUpRow txn={expenseTxn} />);
    // extractMerchant strips trailing digits: "Coles 4321" → "Coles"
    expect(screen.getByText("Coles")).toBeInTheDocument();
  });

  it("renders a Money amount for an expense (negative cents)", () => {
    const { container } = render(<TUpRow txn={expenseTxn} />);
    // Money renders the formatted amount; the minus sign is "−" (en-dash)
    expect(container.textContent).toMatch(/142/);
  });

  it("renders a Money amount for income (positive cents)", () => {
    const { container } = render(<TUpRow txn={incomeTxn} />);
    expect(container.textContent).toMatch(/2,600/);
  });
});
