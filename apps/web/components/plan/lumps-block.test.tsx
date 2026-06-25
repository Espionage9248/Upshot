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

test("month stepper moves the lump month and clamps forward-only to [+1, +12]", () => {
  const onPatch = vi.fn();
  const withLump: ScenarioInputs = { ...base, lumpSums: [{ amountCents: 100000, month: "2026-12", targetDebtId: null }] };
  const { rerender } = render(<LumpsBlock inputs={withLump} startMonth="2026-06" onPatch={onPatch} />);
  fireEvent.click(screen.getByRole("button", { name: "Later one-off payment month" }));
  expect(onPatch).toHaveBeenCalledWith({ lumpSums: [{ amountCents: 100000, month: "2027-01", targetDebtId: null }] });
  fireEvent.click(screen.getByRole("button", { name: "Earlier one-off payment month" }));
  expect(onPatch).toHaveBeenCalledWith({ lumpSums: [{ amountCents: 100000, month: "2026-11", targetDebtId: null }] });
  // at max (+12 = 2027-06): Later disabled
  rerender(<LumpsBlock inputs={{ ...base, lumpSums: [{ amountCents: 100000, month: "2027-06", targetDebtId: null }] }} startMonth="2026-06" onPatch={onPatch} />);
  expect(screen.getByRole("button", { name: "Later one-off payment month" })).toBeDisabled();
  // at min (+1 = 2026-07): Earlier disabled
  rerender(<LumpsBlock inputs={{ ...base, lumpSums: [{ amountCents: 100000, month: "2026-07", targetDebtId: null }] }} startMonth="2026-06" onPatch={onPatch} />);
  expect(screen.getByRole("button", { name: "Earlier one-off payment month" })).toBeDisabled();
});

test("remove drops the lump at that index", () => {
  const onPatch = vi.fn();
  const withLump: ScenarioInputs = { ...base, lumpSums: [{ amountCents: 200000, month: "2027-03", targetDebtId: null }] };
  render(<LumpsBlock inputs={withLump} startMonth="2026-06" onPatch={onPatch} />);
  fireEvent.click(screen.getByRole("button", { name: "Remove one-off payment" }));
  expect(onPatch).toHaveBeenCalledWith({ lumpSums: [] });
});
