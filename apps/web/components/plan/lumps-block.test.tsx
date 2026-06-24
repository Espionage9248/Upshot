import { render, screen, fireEvent } from "@testing-library/react";
import { vi, test, expect } from "vitest";
import type { ScenarioInputs } from "@upshot/db";
import { LumpsBlock } from "./lumps-block";

const base: ScenarioInputs = {
  mode: "FORWARD", baseIncomeCents: 0, raise: null, discretionaryCents: 0, recurringEdits: [],
  toDebtShareBps: 5000, strategy: "AVALANCHE", customOrder: null, lumpSums: [], targetMonth: null,
};

test("empty shows the hint; add appends a default lump", () => {
  const onPatch = vi.fn();
  render(<LumpsBlock inputs={base} startMonth="2026-06" onPatch={onPatch} />);
  expect(screen.getByText(/No one-off payments yet/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Add a one-off payment" }));
  expect(onPatch).toHaveBeenCalledWith({ lumpSums: [{ amountCents: 100000, month: "2026-12", targetDebtId: null }] });
});

test("remove drops the lump at that index", () => {
  const onPatch = vi.fn();
  const withLump: ScenarioInputs = { ...base, lumpSums: [{ amountCents: 200000, month: "2027-03", targetDebtId: null }] };
  render(<LumpsBlock inputs={withLump} startMonth="2026-06" onPatch={onPatch} />);
  fireEvent.click(screen.getByRole("button", { name: "Remove one-off payment" }));
  expect(onPatch).toHaveBeenCalledWith({ lumpSums: [] });
});
