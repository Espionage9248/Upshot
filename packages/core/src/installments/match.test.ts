import { describe, it, expect } from "vitest";
import { matchInstallments, planProgress } from "./match";

// Authoritative test scenario from task-B1-brief.md
describe("matchInstallments", () => {
  const plan = {
    id: "plan-1",
    merchant: "Afterpay",
    installmentCents: 2500,
    totalInstallments: 4,
    installmentsPaid: 1,
    frequencyDays: 14,
    nextDueDate: "2026-06-01",
    status: "ACTIVE" as const,
  };

  const txBase = {
    description: "AFTERPAY purchase",
    isTransfer: false,
  };

  // Three in-range transactions — should all match
  const tx1 = { id: "tx-1", ...txBase, amountCents: -2500, createdAt: "2026-06-01T10:00:00.000Z" };
  const tx2 = { id: "tx-2", ...txBase, amountCents: -2550, createdAt: "2026-06-15T10:00:00.000Z" }; // +2% — within 10%
  const tx3 = { id: "tx-3", ...txBase, amountCents: -2300, createdAt: "2026-06-29T10:00:00.000Z" }; // -8% — within 10%

  // Should be ignored: transfer
  const txTransfer = { id: "tx-transfer", description: "Afterpay transfer", amountCents: -2500, createdAt: "2026-06-01T11:00:00.000Z", isTransfer: true };

  // Should be ignored: amount out of tolerance (>10%)
  const txBig = { id: "tx-big", ...txBase, amountCents: -2800, createdAt: "2026-06-01T12:00:00.000Z" }; // +12%

  // Already linked — idempotency check
  const txLinked = { id: "tx-linked", ...txBase, amountCents: -2500, createdAt: "2026-05-18T10:00:00.000Z" };

  it("matches 3 in-range transactions, assigns correct dueIndex values, advances nextDueDate, sets COMPLETE", () => {
    const { matches, planUpdates } = matchInstallments(
      [plan],
      [tx1, tx2, tx3, txTransfer, txBig, txLinked],
      new Set(["tx-linked"]),
    );

    // 3 matches produced (tx-linked skipped, txTransfer skipped, txBig skipped)
    expect(matches).toHaveLength(3);

    // dueIndex continues from installmentsPaid (1) → 2, 3, 4
    expect(matches[0]!.dueIndex).toBe(2);
    expect(matches[1]!.dueIndex).toBe(3);
    expect(matches[2]!.dueIndex).toBe(4);

    // planIds are correct
    expect(matches.every(m => m.planId === "plan-1")).toBe(true);

    // transactionIds in chronological order
    expect(matches[0]!.transactionId).toBe("tx-1");
    expect(matches[1]!.transactionId).toBe("tx-2");
    expect(matches[2]!.transactionId).toBe("tx-3");

    // 1 planUpdate
    expect(planUpdates).toHaveLength(1);
    const update = planUpdates[0]!;
    expect(update.planId).toBe("plan-1");

    // installmentsPaid = 1 + 3 = 4
    expect(update.installmentsPaid).toBe(4);

    // status = COMPLETE because 1 + 3 >= 4
    expect(update.status).toBe("COMPLETE");

    // nextDueDate advanced by 3 * 14 = 42 days from 2026-06-01
    // 2026-06-01 + 14 = 2026-06-15
    // 2026-06-15 + 14 = 2026-06-29
    // 2026-06-29 + 14 = 2026-07-13
    expect(update.nextDueDate).toBe("2026-07-13");
  });

  it("skips transfers", () => {
    const { matches } = matchInstallments([plan], [txTransfer], new Set());
    expect(matches).toHaveLength(0);
  });

  it("skips out-of-tolerance transactions (>10%)", () => {
    const { matches } = matchInstallments([plan], [txBig], new Set());
    expect(matches).toHaveLength(0);
  });

  it("skips already-linked transactions (idempotency)", () => {
    const { matches } = matchInstallments([plan], [txLinked], new Set(["tx-linked"]));
    expect(matches).toHaveLength(0);
  });

  it("does not match COMPLETE plans", () => {
    const completePlan = { ...plan, status: "COMPLETE" as const };
    const { matches } = matchInstallments([completePlan], [tx1], new Set());
    expect(matches).toHaveLength(0);
  });

  it("only matches up to remaining installments", () => {
    // plan has 1 paid, 4 total → only 3 slots remain even if more txs match
    const manyTxs = [tx1, tx2, tx3, { id: "tx-4", ...txBase, amountCents: -2500, createdAt: "2026-07-13T10:00:00.000Z" }];
    const { matches } = matchInstallments([plan], manyTxs, new Set());
    expect(matches).toHaveLength(3); // capped at totalInstallments - installmentsPaid = 3
  });

  it("paidAt uses settledAt when available, createdAt otherwise", () => {
    const txWithSettled = { id: "tx-s", ...txBase, amountCents: -2500, createdAt: "2026-06-01T10:00:00.000Z", settledAt: "2026-06-02T10:00:00.000Z" };
    const { matches } = matchInstallments([plan], [txWithSettled], new Set());
    expect(matches[0]!.paidAt).toBe("2026-06-02T10:00:00.000Z");
  });

  it("sorts by settledAt ?? createdAt ascending before matching", () => {
    // tx-later has earlier settledAt, should be matched first
    const txEarlierSettled = { id: "tx-es", ...txBase, amountCents: -2500, createdAt: "2026-06-10T10:00:00.000Z", settledAt: "2026-05-28T10:00:00.000Z" };
    const txLaterCreated = { id: "tx-lc", ...txBase, amountCents: -2500, createdAt: "2026-06-01T10:00:00.000Z" };
    // Cap plan to 1 remaining slot so we can see which one wins
    const onePlan = { ...plan, installmentsPaid: 3 };
    const { matches } = matchInstallments([onePlan], [txLaterCreated, txEarlierSettled], new Set());
    expect(matches).toHaveLength(1);
    expect(matches[0]!.transactionId).toBe("tx-es"); // earliest settled date
  });
});

describe("planProgress", () => {
  it("computes paidCents, totalCents, remainingCents, percentComplete", () => {
    const result = planProgress({ installmentCents: 2500, totalInstallments: 4, installmentsPaid: 1 });
    expect(result.paidCents).toBe(2500);
    expect(result.totalCents).toBe(10000);
    expect(result.remainingCents).toBe(7500);
    expect(result.percentComplete).toBe(25);
  });

  it("shows 100% when fully paid", () => {
    const result = planProgress({ installmentCents: 2500, totalInstallments: 4, installmentsPaid: 4 });
    expect(result.remainingCents).toBe(0);
    expect(result.percentComplete).toBe(100);
  });
});
