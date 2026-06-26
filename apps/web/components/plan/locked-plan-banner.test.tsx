import { render, screen, fireEvent } from "@testing-library/react";
import { vi, it, expect } from "vitest";
import type { PlanningData } from "@/app/(app)/plan/debts/planning-data";

vi.mock("@/server-actions/planner", () => ({
  unlockPayoffPlanAction: vi.fn(async () => ({ ok: true, data: undefined })),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { LockedPlanBanner } from "./locked-plan-banner";

function locked(
  over: Partial<NonNullable<PlanningData["lockedPlan"]>> = {},
): NonNullable<PlanningData["lockedPlan"]> {
  return {
    lockedAt: "2026-01-01T00:00:00Z",
    extraPaymentCents: 40000,
    projectedDebtFreeMonth: "2028-02",
    expectedBalanceCents: 500000,
    currentBalanceCents: 580000,
    status: "on-track",
    balanceGapCents: 0,
    slipMonths: 0,
    contributionsShortfallCents: 0,
    lockBalanceCents: 1000000,
    projectedCurve: [{ month: "2026-01", balanceCents: 1000000 }],
    inputs: null,
    ...over,
  };
}

it("shows % paid in the gauge", () => {
  render(
    <LockedPlanBanner
      locked={locked({ lockBalanceCents: 1000000, currentBalanceCents: 580000 })}
      onRemodel={() => {}}
    />,
  );
  expect(screen.getByText("42%")).toBeInTheDocument(); // (1,000,000-580,000)/1,000,000
});

it("renders ahead status as early slip + Re-model fires onRemodel", () => {
  const onRemodel = vi.fn();
  render(
    <LockedPlanBanner
      locked={locked({ status: "ahead", slipMonths: -2 })}
      onRemodel={onRemodel}
    />,
  );
  expect(screen.getByText("▲ 2 mo early")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Re-model/i }));
  expect(onRemodel).toHaveBeenCalledOnce();
});

it("opens the unlock confirm dialog", () => {
  render(<LockedPlanBanner locked={locked()} onRemodel={() => {}} />);
  fireEvent.click(screen.getByRole("button", { name: /Unlock/i }));
  expect(screen.getByText("Unlock your plan?")).toBeInTheDocument();
});
