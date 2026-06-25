import { render, screen, act } from "@testing-library/react";
import { test, expect } from "vitest";
import { PayoffChart } from "./payoff-chart";

const scenario = [
  { month: "2026-06", balanceCents: 1304000 },
  { month: "2026-12", balanceCents: 800000 },
  { month: "2027-06", balanceCents: 200000 },
  { month: "2028-02", balanceCents: 0 },
];
const baseline = [
  { month: "2026-06", balanceCents: 1304000 },
  { month: "2027-06", balanceCents: 900000 },
  { month: "2028-06", balanceCents: 500000 },
  { month: "2029-08", balanceCents: 0 },
];

test("renders an svg with TODAY divider, DEBT-FREE flag and a $ tick label", () => {
  render(
    <PayoffChart
      startMonth="2026-06"
      scenario={scenario}
      baseline={baseline}
      scenarioDebtFreeMonth="2028-02"
      baselineDebtFreeMonth="2029-08"
    />,
  );
  expect(screen.getByLabelText("Projected debt balance over time")).toBeInTheDocument();
  expect(screen.getByText("TODAY")).toBeInTheDocument();
  expect(screen.getByText("DEBT-FREE")).toBeInTheDocument();
  // a nice-tick dollar label (e.g. "$0")
  expect(screen.getByText("$0")).toBeInTheDocument();
});

test("renders lump notch when lump prop is provided", () => {
  render(
    <PayoffChart
      startMonth="2026-06"
      scenario={scenario}
      baseline={baseline}
      scenarioDebtFreeMonth="2028-02"
      baselineDebtFreeMonth="2029-08"
      lump={{ monthIndex: 6, amountCents: 200000 }}
    />,
  );
  expect(screen.getByText("+ lump")).toBeInTheDocument();
});

test("empty curves do not crash", () => {
  render(
    <PayoffChart
      startMonth="2026-06"
      scenario={[]}
      baseline={[]}
      scenarioDebtFreeMonth={null}
      baselineDebtFreeMonth={null}
    />,
  );
  // empty → well, not SVG
  expect(screen.getByText("Your payoff curve will appear here")).toBeInTheDocument();
});

test("shows the recomputing caption while loading", () => {
  render(
    <PayoffChart
      startMonth="2026-06"
      scenario={[]}
      baseline={[]}
      scenarioDebtFreeMonth={null}
      baselineDebtFreeMonth={null}
      loading
    />,
  );
  expect(screen.getByText(/Recomputing against your current debts/i)).toBeInTheDocument();
});

test("shows an empty well when there is no data and not loading", () => {
  render(
    <PayoffChart
      startMonth="2026-06"
      scenario={[]}
      baseline={[]}
      scenarioDebtFreeMonth={null}
      baselineDebtFreeMonth={null}
    />,
  );
  expect(screen.getByText("Your payoff curve will appear here")).toBeInTheDocument();
  expect(
    screen.getByText(
      /Add an extra amount toward your debts/i,
    ),
  ).toBeInTheDocument();
});

test("draws the locked reference curve when provided", () => {
  render(
    <PayoffChart
      startMonth="2026-06"
      scenario={[{ month: "2026-06", balanceCents: 900000 }]}
      baseline={[]}
      scenarioDebtFreeMonth={null}
      baselineDebtFreeMonth={null}
      lockedCurve={[
        { month: "2026-06", balanceCents: 1000000 },
        { month: "2026-12", balanceCents: 500000 },
      ]}
    />,
  );
  // scenario path + locked reference path = at least 2 paths in SVG
  expect(document.querySelectorAll("path").length).toBeGreaterThan(1);
});

test("draws you-are-here dot when youAreHere is provided with lockedCurve", () => {
  render(
    <PayoffChart
      startMonth="2026-06"
      scenario={[{ month: "2026-06", balanceCents: 900000 }]}
      baseline={[]}
      scenarioDebtFreeMonth={null}
      baselineDebtFreeMonth={null}
      lockedCurve={[
        { month: "2026-06", balanceCents: 1000000 },
        { month: "2026-12", balanceCents: 500000 },
      ]}
      youAreHere={{ month: "2026-06", balanceCents: 1000000 }}
    />,
  );
  expect(screen.getByText("you are here")).toBeInTheDocument();
});

test("renders a pay-rise notch when raise prop is provided", () => {
  render(
    <PayoffChart
      startMonth="2026-06"
      scenario={scenario}
      baseline={baseline}
      scenarioDebtFreeMonth="2028-02"
      baselineDebtFreeMonth="2029-08"
      raise={{ fromMonth: "2026-12" }}
    />,
  );
  expect(screen.getByText(/pay rise/i)).toBeInTheDocument();
});

test("no notch when raise is null", () => {
  render(
    <PayoffChart
      startMonth="2026-06"
      scenario={scenario}
      baseline={baseline}
      scenarioDebtFreeMonth="2028-02"
      baselineDebtFreeMonth="2029-08"
      raise={null}
    />,
  );
  expect(screen.queryByText(/pay rise/i)).toBeNull();
});

test("shows a floating readout on hover when interactive", () => {
  const { container } = render(
    <PayoffChart
      startMonth="2026-06"
      scenario={[{ month: "2026-06", balanceCents: 300000 }, { month: "2026-07", balanceCents: 250000 }, { month: "2026-08", balanceCents: 0 }]}
      baseline={[{ month: "2026-06", balanceCents: 300000 }, { month: "2026-07", balanceCents: 280000 }, { month: "2026-08", balanceCents: 260000 }]}
      scenarioDebtFreeMonth="2026-08"
      baselineDebtFreeMonth={null}
      height={320}
      interactive
    />,
  );
  const svg = container.querySelector("svg")!;
  svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1000, height: 320, right: 1000, bottom: 320, x: 0, y: 0, toJSON: () => {} }) as DOMRect;
  // jsdom@25 has no PointerEvent; use MouseEvent with type "pointermove" and
  // inject clientX + pointerType via Object.defineProperty so React sees them.
  // Wrap in act() so the setHoverM state update flushes before we assert.
  act(() => {
    const event = new MouseEvent("pointermove", { bubbles: true, cancelable: true, clientX: 500, clientY: 150 });
    Object.defineProperty(event, "pointerType", { value: "mouse", configurable: true });
    svg.dispatchEvent(event);
  });
  // readout card surfaces a month label and at least one balance.
  expect(screen.getByRole("status", { name: /payoff readout/i })).toBeInTheDocument();
});

test("renders a rows-below legend in compact mode", () => {
  render(
    <PayoffChart
      startMonth="2026-06"
      scenario={[{ month: "2026-06", balanceCents: 300000 }, { month: "2027-06", balanceCents: 0 }]}
      baseline={[{ month: "2026-06", balanceCents: 300000 }, { month: "2028-06", balanceCents: 0 }]}
      scenarioDebtFreeMonth="2027-06"
      baselineDebtFreeMonth="2028-06"
      height={190}
      compact
    />,
  );
  expect(screen.getByText(/Your plan/i)).toBeInTheDocument();
  expect(screen.getByText(/Doing nothing/i)).toBeInTheDocument();
});
