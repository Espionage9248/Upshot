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
  expect(onPatch).toHaveBeenCalledWith({ raise: { toCents: 546000, fromMonth: "2026-09", toDebtBps: 5000 } });

  const withRaise: ScenarioInputs = { ...base, raise: { toCents: 546000, fromMonth: "2026-09", toDebtBps: 5000 } };
  rerender(<IncomeBlock inputs={withRaise} incomeSeedCents={496000} startMonth="2026-06" onPatch={onPatch} />);
  fireEvent.click(screen.getByRole("switch", { name: "Model a pay rise" }));
  expect(onPatch).toHaveBeenCalledWith({ raise: null });
});

test("month stepper: + moves the raise month later, − moves it earlier", () => {
  const onPatch = vi.fn();
  const r: ScenarioInputs = { ...base, raise: { toCents: 546000, fromMonth: "2026-09", toDebtBps: 5000 } };
  render(<IncomeBlock inputs={r} incomeSeedCents={496000} startMonth="2026-06" onPatch={onPatch} />);
  fireEvent.click(screen.getByRole("button", { name: "Later raise month" }));
  expect(onPatch).toHaveBeenCalledWith({ raise: { toCents: 546000, fromMonth: "2026-10", toDebtBps: 5000 } });
  fireEvent.click(screen.getByRole("button", { name: "Earlier raise month" }));
  expect(onPatch).toHaveBeenCalledWith({ raise: { toCents: 546000, fromMonth: "2026-08", toDebtBps: 5000 } });
});

test("month stepper clamps forward-only to [+1, +12]", () => {
  const onPatch = vi.fn();
  // at min (start+1 = 2026-07): Earlier is disabled
  const atMin: ScenarioInputs = { ...base, raise: { toCents: 546000, fromMonth: "2026-07", toDebtBps: 5000 } };
  const { rerender } = render(<IncomeBlock inputs={atMin} incomeSeedCents={496000} startMonth="2026-06" onPatch={onPatch} />);
  expect(screen.getByRole("button", { name: "Earlier raise month" })).toBeDisabled();
  // at max (start+12 = 2027-06): Later is disabled
  const atMax: ScenarioInputs = { ...base, raise: { toCents: 546000, fromMonth: "2027-06", toDebtBps: 5000 } };
  rerender(<IncomeBlock inputs={atMax} incomeSeedCents={496000} startMonth="2026-06" onPatch={onPatch} />);
  expect(screen.getByRole("button", { name: "Later raise month" })).toBeDisabled();
});

test("raise→debt slider patches toDebtBps; hidden in TARGET_DATE", () => {
  const onPatch = vi.fn();
  const r: ScenarioInputs = { ...base, raise: { toCents: 546000, fromMonth: "2026-09", toDebtBps: 5000 } };
  const { rerender } = render(<IncomeBlock inputs={r} incomeSeedCents={496000} startMonth="2026-06" onPatch={onPatch} />);
  fireEvent.keyDown(screen.getByRole("slider", { name: "Share of pay rise toward debt" }), { key: "ArrowRight" });
  expect(onPatch).toHaveBeenCalled();
  rerender(<IncomeBlock inputs={{ ...r, mode: "TARGET_DATE" }} incomeSeedCents={496000} startMonth="2026-06" onPatch={onPatch} />);
  expect(screen.queryByRole("slider", { name: "Share of pay rise toward debt" })).toBeNull();
});
