import { describe, expect, it } from "vitest";
import { transactionSchema } from "./transaction";

describe("transactionSchema", () => {
  it("applies defaults for boolean flags and currency", () => {
    const parsed = transactionSchema.parse({
      id: "txn-1", accountId: "acc-1", status: "SETTLED", description: "Coffee",
      message: null, rawText: null, amountCents: -550, foreignAmountCents: null, foreignCurrency: null,
      categoryId: null, parentCategoryId: null, transferAccountId: null, taxDeductionCategory: null,
      cardPurchaseMethod: null, cardNumberSuffix: null, roundUpCents: null, cashbackCents: null,
      note: null, attachmentId: null, attachmentUrl: null, settledAt: null, createdAt: "t",
    });
    expect(parsed.currency).toBe("AUD");
    expect(parsed.isTransfer).toBe(false);
    expect(parsed.isInterest).toBe(false);
  });
  it("rejects an unknown status", () => {
    expect(() =>
      transactionSchema.parse({ id: "t", accountId: "a", status: "PENDING", description: "x", amountCents: 0, createdAt: "t" }),
    ).toThrow();
  });
});
