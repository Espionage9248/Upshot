import { describe, it, expect } from "vitest";
import { bnplRollup } from "./rollup";

describe("bnplRollup", () => {
  it("returns zeros and null nextDueDate for empty input", () => {
    const result = bnplRollup([]);
    expect(result.remainingCents).toBe(0);
    expect(result.activeCount).toBe(0);
    expect(result.nextDueDate).toBeNull();
  });

  it("sums remaining cents only for ACTIVE plans; COMPLETE plan is excluded", () => {
    const plans = [
      {
        totalInstallments: 4,
        installmentsPaid: 1,
        installmentCents: 2500,
        status: "ACTIVE",
        nextDueDate: "2026-07-01",
      },
      {
        totalInstallments: 4,
        installmentsPaid: 4,
        installmentCents: 5000,
        status: "COMPLETE",
        nextDueDate: "2026-06-15",
      },
    ];
    const result = bnplRollup(plans);
    // ACTIVE plan: (4 - 1) * 2500 = 7500; COMPLETE is excluded
    expect(result.remainingCents).toBe(7500);
    expect(result.activeCount).toBe(1);
    // nextDueDate from ACTIVE plan only
    expect(result.nextDueDate).toBe("2026-07-01");
  });

  it("returns earliest nextDueDate among multiple ACTIVE plans", () => {
    const plans = [
      {
        totalInstallments: 3,
        installmentsPaid: 0,
        installmentCents: 1000,
        status: "ACTIVE",
        nextDueDate: "2026-08-01",
      },
      {
        totalInstallments: 2,
        installmentsPaid: 1,
        installmentCents: 2000,
        status: "ACTIVE",
        nextDueDate: "2026-07-15",
      },
      {
        totalInstallments: 6,
        installmentsPaid: 2,
        installmentCents: 500,
        status: "ACTIVE",
        nextDueDate: "2026-07-20",
      },
    ];
    const result = bnplRollup(plans);
    // remainingCents = (3-0)*1000 + (2-1)*2000 + (6-2)*500 = 3000 + 2000 + 2000 = 7000
    expect(result.remainingCents).toBe(7000);
    expect(result.activeCount).toBe(3);
    // earliest is 2026-07-15
    expect(result.nextDueDate).toBe("2026-07-15");
  });

  it("returns null nextDueDate when all plans are COMPLETE", () => {
    const plans = [
      {
        totalInstallments: 4,
        installmentsPaid: 4,
        installmentCents: 3000,
        status: "COMPLETE",
        nextDueDate: "2026-06-01",
      },
    ];
    const result = bnplRollup(plans);
    expect(result.remainingCents).toBe(0);
    expect(result.activeCount).toBe(0);
    expect(result.nextDueDate).toBeNull();
  });
});
