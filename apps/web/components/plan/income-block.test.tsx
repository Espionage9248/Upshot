import { render, screen, fireEvent } from "@testing-library/react";
import { vi, test, expect } from "vitest";
import type { ScenarioInputs } from "@upshot/db";
import { IncomeBlock } from "./income-block";

const base: ScenarioInputs = {
  mode: "FORWARD", baseIncomeCents: 496000, raise: null, discretionaryCents: 0, recurringEdits: [],
  toDebtShareBps: 5000, strategy: "AVALANCHE", customOrder: null, lumpSums: [], targetMonth: null,
};

test("base income input patches baseIncomeCents; seed hint shown", () => {
  const onPatch = vi.fn();
  render(<IncomeBlock inputs={base} incomeSeedCents={496000} startMonth="2026-06" onPatch={onPatch} />);
  expect(screen.getByText("detected from salary deposits")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Base monthly income"), { target: { value: "5200" } });
  expect(onPatch).toHaveBeenCalledWith({ baseIncomeCents: 520000 });
});

test("toggling the pay rise on sets a default raise object; off clears it", () => {
  const onPatch = vi.fn();
  const { rerender } = render(<IncomeBlock inputs={base} incomeSeedCents={496000} startMonth="2026-06" onPatch={onPatch} />);
  fireEvent.click(screen.getByRole("switch", { name: "Model a pay rise" }));
  expect(onPatch).toHaveBeenCalledWith({ raise: { toCents: 546000, fromMonth: "2026-09" } });

  const withRaise: ScenarioInputs = { ...base, raise: { toCents: 546000, fromMonth: "2026-09" } };
  rerender(<IncomeBlock inputs={withRaise} incomeSeedCents={496000} startMonth="2026-06" onPatch={onPatch} />);
  fireEvent.click(screen.getByRole("switch", { name: "Model a pay rise" }));
  expect(onPatch).toHaveBeenCalledWith({ raise: null });
});
