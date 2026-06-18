import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { EmergencyFundAnalysis } from "@upshot/core";
import { EmergencyFundCard } from "./emergency-fund-card";

function makeFund(overrides: Partial<EmergencyFundAnalysis> = {}): EmergencyFundAnalysis {
  return {
    accountId: "acc-emergency",
    accountName: "Emergency Fund",
    currentBalance: 450000,
    targetBalance: 600000,
    targetMonths: 6,
    progressPercent: 75,
    status: "BUILDING",
    withdrawalsThisMonth: 0,
    topUpNeeded: 150000,
    topUpRecommendation: null,
    replenishmentNeeded: 0,
    monthlyAllocation: 25000,
    monthlyInboundThisMonth: 25000,
    savingsShortfallThisMonth: 0,
    savingsOnTrack: true,
    readinessScore: 75,
    readinessTier: "good",
    readinessTips: [],
    ...overrides,
  };
}

describe("EmergencyFundCard", () => {
  it("renders the readiness gauge percentage", () => {
    render(<EmergencyFundCard fund={makeFund()} />);
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("renders balance vs target", () => {
    render(<EmergencyFundCard fund={makeFund()} />);
    expect(screen.getByText(/\$4,500/)).toBeInTheDocument();
    expect(screen.getByText(/\$6,000/)).toBeInTheDocument();
  });

  it("renders the top-up still needed when below target", () => {
    render(<EmergencyFundCard fund={makeFund()} />);
    expect(screen.getByText(/still needed/i)).toBeInTheDocument();
    expect(screen.getByText(/\$1,500/)).toBeInTheDocument();
  });

  it("renders 'Fully funded' when the goal is met", () => {
    render(<EmergencyFundCard fund={makeFund({ topUpNeeded: 0, progressPercent: 100, status: "GOAL_MET" })} />);
    expect(screen.getByText(/fully funded/i)).toBeInTheDocument();
  });

  it("renders readiness tips when present", () => {
    render(<EmergencyFundCard fund={makeFund({ readinessTips: ["Cover at least 1 month of expenses."] })} />);
    expect(screen.getByText(/cover at least 1 month/i)).toBeInTheDocument();
  });
});
