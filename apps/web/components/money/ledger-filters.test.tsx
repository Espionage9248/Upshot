import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LedgerFilters } from "./ledger-filters";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/money",
  useSearchParams: () => new URLSearchParams(""),
}));

function renderFilters() {
  render(
    <LedgerFilters
      accountOptions={[{ value: "acc-1", label: "Spending" }]}
      categoryOptions={[{ value: "cat-groceries", label: "Groceries" }]}
      tagOptions={[{ value: "tag-work", label: "tag-work" }]}
    />,
  );
}

describe("LedgerFilters", () => {
  beforeEach(() => replace.mockReset());

  it("pushes the free-text query into the URL search params", async () => {
    renderFilters();
    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: { value: "woolworths" },
    });
    await waitFor(() => {
      expect(replace).toHaveBeenCalled();
      const url = replace.mock.calls.at(-1)?.[0] as string;
      expect(url).toContain("q=woolworths");
    });
  });

  it("toggles a flag filter into the URL search params", async () => {
    renderFilters();
    fireEvent.click(screen.getByRole("button", { name: /salary/i }));
    await waitFor(() => {
      const url = replace.mock.calls.at(-1)?.[0] as string;
      expect(url).toContain("salary=1");
    });
  });
});
