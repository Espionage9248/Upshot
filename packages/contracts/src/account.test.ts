import { describe, expect, it } from "vitest";
import { accountSchema } from "./account";

describe("accountSchema", () => {
  it("accepts a valid account", () => {
    const parsed = accountSchema.parse({
      id: "acc-1", name: "Spending", type: "TRANSACTIONAL", ownership: "INDIVIDUAL",
      balanceCents: 1000, role: "SPENDING", monthlyAllocationCents: 0,
      createdAt: "2026-06-12T00:00:00.000Z", updatedAt: "2026-06-12T00:00:00.000Z", lastSyncedAt: null,
      goalTargetCents: null, goalTargetDate: null,
    });
    expect(parsed.balanceCents).toBe(1000);
  });
  it("rejects an unknown role", () => {
    expect(() =>
      accountSchema.parse({
        id: "acc-1", name: "x", type: "TRANSACTIONAL", ownership: "INDIVIDUAL",
        balanceCents: 0, role: "WURST", createdAt: "t", updatedAt: "t", lastSyncedAt: null,
        goalTargetCents: null, goalTargetDate: null,
      }),
    ).toThrow();
  });
  it("rejects a non-integer balance", () => {
    expect(() =>
      accountSchema.parse({
        id: "acc-1", name: "x", type: "SAVER", ownership: "JOINT",
        balanceCents: 10.5, role: "SAVER", createdAt: "t", updatedAt: "t", lastSyncedAt: null,
        goalTargetCents: null, goalTargetDate: null,
      }),
    ).toThrow();
  });
  it("parses a row WITH goal fields set", () => {
    const parsed = accountSchema.parse({
      id: "acc-1", name: "Holiday", type: "SAVER", ownership: "INDIVIDUAL",
      balanceCents: 100000, role: "SAVER", monthlyAllocationCents: 5000,
      createdAt: "2026-06-12T00:00:00.000Z", updatedAt: "2026-06-12T00:00:00.000Z",
      lastSyncedAt: null,
      goalTargetCents: 500000,
      goalTargetDate: "2027-01-01",
    });
    expect(parsed.goalTargetCents).toBe(500000);
    expect(parsed.goalTargetDate).toBe("2027-01-01");
  });
  it("parses a row WITHOUT goal fields (explicit null — nullable not optional)", () => {
    const parsed = accountSchema.parse({
      id: "acc-1", name: "Spending", type: "TRANSACTIONAL", ownership: "INDIVIDUAL",
      balanceCents: 1000, role: "SPENDING", monthlyAllocationCents: 0,
      createdAt: "2026-06-12T00:00:00.000Z", updatedAt: "2026-06-12T00:00:00.000Z",
      lastSyncedAt: null,
      goalTargetCents: null,
      goalTargetDate: null,
    });
    expect(parsed.goalTargetCents).toBeNull();
    expect(parsed.goalTargetDate).toBeNull();
  });
});
