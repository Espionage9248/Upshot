import { render, screen } from "@testing-library/react";
import { vi, test, expect } from "vitest";
vi.mock("@/server-actions/debts", () => ({ whatIfAction: vi.fn(async () => ({ ok: true as const, data: { withChanges: {} as never, base: {} as never, monthsSaved: 3, interestSavedCents: 4500 } })) }));
import { WhatIfPanel } from "./what-if-panel";

test("renders the extra-payment and refinance sections", () => {
  render(<WhatIfPanel debts={[{ id: "d1", name: "Visa" }]} />);
  expect(screen.getByText("Extra payment per month")).toBeInTheDocument();
  expect(screen.getByText("What if I refinance?")).toBeInTheDocument();
  expect(screen.getByRole("slider", { name: "Extra monthly payment" })).toBeInTheDocument();
});
