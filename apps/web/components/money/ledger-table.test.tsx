import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

import { LedgerTable } from "./ledger-table";
import type { TransactionRow } from "@/app/(app)/money/data";

function tx(overrides: Partial<TransactionRow>): TransactionRow {
  return {
    id: "tx-1",
    accountId: "acc-1",
    status: "SETTLED",
    description: "Woolworths Metro",
    message: null,
    rawText: null,
    amountCents: -2340,
    currency: "AUD",
    foreignAmountCents: null,
    foreignCurrency: null,
    categoryId: "cat-groceries",
    parentCategoryId: null,
    isTransfer: false,
    transferAccountId: null,
    isSalary: false,
    isInterest: false,
    isTaxDeductible: false,
    taxDeductionCategory: null,
    cardPurchaseMethod: null,
    cardNumberSuffix: null,
    roundUpCents: null,
    cashbackCents: null,
    note: null,
    attachmentId: null,
    attachmentUrl: null,
    settledAt: null,
    createdAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

const categoryNames = { "cat-groceries": "Groceries" };

describe("LedgerTable", () => {
  it("renders a row with merchant, signed Money (tnum) and category badge", () => {
    render(
      <LedgerTable
        rows={[tx({})]}
        total={1}
        page={0}
        hasNext={false}
        categoryNames={categoryNames}
        rowTagIds={{}}
        searchParams={{}}
        categoryOptions={[]}
        tagOptions={[]}
      />,
    );
    expect(screen.getByText("Woolworths Metro")).toBeInTheDocument();
    // Money: expense sign + tnum tabular figures.
    const money = screen.getByText(/23\.40/);
    const hasTnum = money.className.includes("tnum") || money.closest('[class*="tnum"]') !== null;
    expect(hasTnum).toBe(true);
    expect(screen.getByText("Groceries")).toBeInTheDocument();
  });

  it("renders the transaction date, preferring settledAt over createdAt", () => {
    render(
      <LedgerTable
        rows={[tx({ settledAt: "2026-06-14T10:00:00.000Z", createdAt: "2026-06-01T00:00:00.000Z" })]}
        total={1}
        page={0}
        hasNext={false}
        categoryNames={categoryNames}
        rowTagIds={{}}
        searchParams={{}}
        categoryOptions={[]}
        tagOptions={[]}
      />,
    );
    expect(screen.getByText("2026-06-14")).toBeInTheDocument();
  });

  it("falls back to createdAt for the date when settledAt is null", () => {
    render(
      <LedgerTable
        rows={[tx({ settledAt: null, createdAt: "2026-06-01T00:00:00.000Z" })]}
        total={1}
        page={0}
        hasNext={false}
        categoryNames={categoryNames}
        rowTagIds={{}}
        searchParams={{}}
        categoryOptions={[]}
        tagOptions={[]}
      />,
    );
    expect(screen.getByText("2026-06-01")).toBeInTheDocument();
  });

  it("renders flag chips for salary / transfer / interest / tax-deductible", () => {
    render(
      <LedgerTable
        rows={[
          tx({
            id: "tx-flagged",
            isSalary: true,
            isTransfer: true,
            isInterest: true,
            isTaxDeductible: true,
          }),
        ]}
        total={1}
        page={0}
        hasNext={false}
        categoryNames={categoryNames}
        rowTagIds={{}}
        searchParams={{}}
        categoryOptions={[]}
        tagOptions={[]}
      />,
    );
    expect(screen.getByText("Salary")).toBeInTheDocument();
    expect(screen.getByText("Transfer")).toBeInTheDocument();
    expect(screen.getByText("Interest")).toBeInTheDocument();
    expect(screen.getByText("Tax-deductible")).toBeInTheDocument();
  });
});
