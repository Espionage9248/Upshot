import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DebtDetail } from "./debt-detail";
import type { DebtDetailData } from "@/app/(app)/plan/debts/[id]/data";
import type { DebtRow } from "@/app/(app)/plan/debts/data";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/server-actions/debts", () => ({
  createDebtAction: vi.fn(),
  updateDebtAction: vi.fn(),
  deleteDebtAction: vi.fn(),
  clearDebtMatchedPaymentsAction: vi.fn(),
}));
vi.mock("@/server-actions/recurring", () => ({ dismissSuggestionAction: vi.fn() }));
vi.mock("@/components/settings/rule-builder/rule-editor", () => ({
  RuleEditor: () => null,
}));

const debt: DebtRow = {
  id: "d1", name: "Zip", type: "BNPL", currentBalanceCents: 10000, originalBalanceCents: null,
  creditLimitCents: null, monthlyPaymentCents: 5000, minimumPaymentCents: null, interestRate: null,
  monthlyFeeCents: null, feeDueDay: null, lastFeeAppliedAt: null, payoffPriority: 999,
  includeInSnowball: true, includeInNetWorth: true, matchRuleId: "r1", paymentsLinkedAt: "2026-06-01",
  accountNumber: null, institutionName: null, notes: null, estimatedPayoffDate: null,
  monthsRemaining: null, totalInterestProjectedCents: null,
};

const data: DebtDetailData = {
  debt, schedule: null,
  analysis: { schedules: [], strategy: "SNOWBALL", totalInterestCents: 0, payoffMonth: "", monthsToPayoff: 0 } as unknown as DebtDetailData["analysis"],
  effectivePaymentCents: 0, paymentIsActual: false,
  ruleOptions: { categoryOptions: [], tagOptions: [], debtOptions: [], recurringOptions: [], installmentOptions: [] },
  payments: [
    { paymentDate: "2026-06-20", amountCents: 3000 },
    { paymentDate: "2026-05-20", amountCents: 2000 },
  ],
  totalPaidCents: 5000,
};

describe("DebtDetail matched payments", () => {
  it("renders the matched-payments list and total paid", () => {
    render(<DebtDetail data={data} />);
    expect(screen.getByText("Matched payments")).toBeInTheDocument();
    expect(screen.getByText("Total paid")).toBeInTheDocument();
    expect(screen.getByText("$50.00")).toBeInTheDocument(); // total
  });
});
