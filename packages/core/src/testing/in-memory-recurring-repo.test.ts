import { describe, it, expect } from "vitest";
import { InMemoryRecurringRepo } from "./in-memory-recurring-repo";
import type { DetectedRecurring } from "../recurring/types";
import type { NewRecurring } from "../ports/recurring-repo";

const baseDetected: DetectedRecurring = {
  descriptionPattern: "netflix",
  displayName: "Netflix",
  amountCents: 1799,
  frequency: "MONTHLY",
  category: "Entertainment",
  merchant: "Netflix",
  accountId: "acc-1",
  firstDate: "2026-01-01",
  lastDate: "2026-06-01",
  nextExpectedDate: "2026-07-01",
};

function makeNew(overrides: Partial<NewRecurring> = {}): NewRecurring {
  return {
    name: "Spotify",
    kind: "SUBSCRIPTION",
    amountCents: 1299,
    frequency: "MONTHLY",
    status: "ACTIVE",
    category: null,
    merchant: null,
    accountId: null,
    isAutoDetected: false,
    matchRuleId: null,
    notes: null,
    nextExpectedDate: null,
    lastDetectedDate: null,
    firstDetectedDate: null,
    ...overrides,
  };
}

describe("InMemoryRecurringRepo", () => {
  it("upsertSuggestion INSERT path: new SUGGESTED row appears via listByStatus", async () => {
    const repo = new InMemoryRecurringRepo();

    await repo.upsertSuggestion(baseDetected);

    const list = await repo.listByStatus("SUGGESTED");
    expect(list).toHaveLength(1);
    expect(list[0]?.name).toBe("Netflix");
    expect(list[0]?.amountCents).toBe(1799);
    expect(list[0]?.status).toBe("SUGGESTED");
    expect(list[0]?.isAutoDetected).toBe(true);
    expect(list[0]?.firstDetectedDate).toBe("2026-01-01");
    expect(list[0]?.lastDetectedDate).toBe("2026-06-01");
    expect(list[0]?.nextExpectedDate).toBe("2026-07-01");
  });

  it("upsertSuggestion INSERT path: getById also returns the new row", async () => {
    const repo = new InMemoryRecurringRepo();

    await repo.upsertSuggestion(baseDetected);

    const [row] = await repo.listByStatus("SUGGESTED");
    expect(row).toBeDefined();
    const got = await repo.getById(row!.id);
    expect(got).not.toBeNull();
    expect(got?.name).toBe("Netflix");
  });

  it("upsertSuggestion UPDATE path: different casing updates row, no duplicate (name.trim().toLowerCase() key)", async () => {
    const repo = new InMemoryRecurringRepo();

    // First upsert — creates row with name "Netflix"
    await repo.upsertSuggestion(baseDetected);

    // Second upsert — same descriptionPattern "netflix", displayName differs only in casing
    await repo.upsertSuggestion({
      ...baseDetected,
      displayName: "NETFLIX", // different casing, same key
      amountCents: 1999,
      lastDate: "2026-07-01",
      nextExpectedDate: "2026-08-01",
    });

    const list = await repo.list();
    // No duplicate — still exactly one row
    expect(list).toHaveLength(1);
    expect(list[0]?.amountCents).toBe(1999);
    expect(list[0]?.lastDetectedDate).toBe("2026-07-01");
    expect(list[0]?.nextExpectedDate).toBe("2026-08-01");
  });

  it("knownPatterns excludes SUGGESTED items and includes ACTIVE and PAUSED", async () => {
    const repo = new InMemoryRecurringRepo();

    // SUGGESTED — must NOT appear
    await repo.upsertSuggestion(baseDetected);

    // ACTIVE — must appear
    await repo.create(makeNew({ name: "Spotify", status: "ACTIVE" }));

    // PAUSED — must appear
    await repo.create(makeNew({ name: "Gym Membership", status: "PAUSED" }));

    const patterns = await repo.knownPatterns();

    expect(patterns.has("netflix")).toBe(false);
    expect(patterns.has("spotify")).toBe(true);
    expect(patterns.has("gym membership")).toBe(true);
  });

  it("knownPatterns includes CANCELLED item — CANCELLED suppression round-trip", async () => {
    const repo = new InMemoryRecurringRepo();

    // Upsert suggestion then cancel it
    await repo.upsertSuggestion(baseDetected);
    const [suggestion] = await repo.listByStatus("SUGGESTED");
    expect(suggestion).toBeDefined();
    await repo.setStatus(suggestion!.id, "CANCELLED");

    const patterns = await repo.knownPatterns();

    // CANCELLED item's pattern MUST appear so future detection skips it
    expect(patterns.has("netflix")).toBe(true);
  });

  it("knownPatterns returns empty set when only SUGGESTED items exist", async () => {
    const repo = new InMemoryRecurringRepo();

    await repo.upsertSuggestion(baseDetected);

    const patterns = await repo.knownPatterns();
    expect(patterns.size).toBe(0);
  });

  it("applyDrift sets amountCents, lastAmountCents, and priceLastChangedAt", async () => {
    const repo = new InMemoryRecurringRepo();

    const id = await repo.create(makeNew({ name: "Gym", kind: "BILL", amountCents: 5000 }));

    await repo.applyDrift(id, 5500, 5000, "2026-07-01T00:00:00.000Z");

    const got = await repo.getById(id);
    expect(got?.amountCents).toBe(5500);
    expect(got?.lastAmountCents).toBe(5000);
    expect(got?.priceLastChangedAt).toBe("2026-07-01T00:00:00.000Z");
  });

  it("setUsage persists usageCount and usageResetAt, and supports reset to null", async () => {
    const repo = new InMemoryRecurringRepo();

    const id = await repo.create(makeNew({ name: "Gym", kind: "BILL", amountCents: 5000 }));

    await repo.setUsage(id, 12, "2026-07-01");

    const got = await repo.getById(id);
    expect(got?.usageCount).toBe(12);
    expect(got?.usageResetAt).toBe("2026-07-01");

    // reset
    await repo.setUsage(id, 0, null);
    const got2 = await repo.getById(id);
    expect(got2?.usageCount).toBe(0);
    expect(got2?.usageResetAt).toBeNull();
  });
});
