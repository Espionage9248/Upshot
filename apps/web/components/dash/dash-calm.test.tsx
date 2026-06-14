import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { SyncHealth } from "@upshot/core";
import type { TodayData, UpcomingBill } from "@/app/(app)/today/data";
import { DashCalm, syncHealthToState, toBillItem } from "./dash-calm";

const baseHealth: SyncHealth = {
  lastSyncAt: "2026-06-15T07:00:00.000Z",
  lastSyncAgeMs: 60_000,
  lastStatus: "SUCCESS",
  tokenHealthy: true,
};

function makeData(overrides: Partial<TodayData> = {}): TodayData {
  return {
    syncHealth: baseHealth,
    accounts: [],
    netWorthCents: 1_234_56,
    upcomingBills: [],
    insights: [],
    ...overrides,
  };
}

describe("syncHealthToState", () => {
  it("maps !tokenHealthy → token regardless of status", () => {
    expect(
      syncHealthToState({ ...baseHealth, tokenHealthy: false, lastStatus: "SUCCESS" }),
    ).toBe("token");
  });
  it("maps FAILED → failed", () => {
    expect(syncHealthToState({ ...baseHealth, lastStatus: "FAILED" })).toBe("failed");
  });
  it("maps RUNNING → syncing", () => {
    expect(syncHealthToState({ ...baseHealth, lastStatus: "RUNNING" })).toBe("syncing");
  });
  it("maps SUCCESS/null → healthy", () => {
    expect(syncHealthToState({ ...baseHealth, lastStatus: "SUCCESS" })).toBe("healthy");
    expect(syncHealthToState({ ...baseHealth, lastStatus: null })).toBe("healthy");
  });
});

describe("toBillItem", () => {
  const now = new Date("2026-06-15T00:00:00.000Z");
  const bill: UpcomingBill = {
    id: "b1",
    name: "Netflix",
    amountCents: 1999,
    nextExpectedDate: "2026-06-20",
    merchant: "Netflix",
    category: null,
  };

  it("maps fields and rounds daysUntil from nextExpectedDate", () => {
    const item = toBillItem(bill, now);
    expect(item.id).toBe("b1");
    expect(item.name).toBe("Netflix");
    expect(item.cents).toBe(1999);
    expect(item.sub).toBe("Netflix");
    expect(item.daysUntil).toBe(5);
  });

  it("falls back to category when merchant is null", () => {
    const item = toBillItem({ ...bill, merchant: null, category: "Streaming" }, now);
    expect(item.sub).toBe("Streaming");
  });

  it("uses 0 daysUntil when nextExpectedDate is null", () => {
    const item = toBillItem({ ...bill, nextExpectedDate: null }, now);
    expect(item.daysUntil).toBe(0);
  });
});

describe("DashCalm", () => {
  it("renders the real net worth amount", () => {
    render(<DashCalm data={makeData({ netWorthCents: 1_234_56 })} />);
    expect(screen.getByText(/\$1,234\.56/)).toBeInTheDocument();
  });

  it("reflects the mapped sync state (token → Reconnect bank)", () => {
    render(
      <DashCalm
        data={makeData({
          syncHealth: { ...baseHealth, tokenHealthy: false },
        })}
      />,
    );
    expect(screen.getByText("Reconnect bank")).toBeInTheDocument();
  });

  it("renders bills when provided", () => {
    render(
      <DashCalm
        data={makeData({
          upcomingBills: [
            {
              id: "b1",
              name: "Netflix",
              amountCents: 1999,
              nextExpectedDate: "2099-01-01",
              merchant: "Netflix Pty Ltd",
              category: null,
            },
          ],
        })}
      />,
    );
    expect(screen.getByText("Netflix")).toBeInTheDocument();
  });

  it("shows an empty state when there are no upcoming bills", () => {
    render(<DashCalm data={makeData({ upcomingBills: [] })} />);
    expect(screen.getByText(/no upcoming bills/i)).toBeInTheDocument();
  });

  it("shows a coming-soon empty state for the safe-to-spend hero", () => {
    render(<DashCalm data={makeData()} />);
    expect(screen.getAllByText(/coming soon/i).length).toBeGreaterThan(0);
  });

  it("shows an empty state for insights (For you)", () => {
    render(<DashCalm data={makeData({ insights: [] })} />);
    expect(screen.getByText(/nothing for you yet/i)).toBeInTheDocument();
  });
});
