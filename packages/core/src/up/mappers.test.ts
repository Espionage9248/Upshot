import { describe, it, expect } from "vitest";
import { mapAccount, mapTransaction, mapCategory } from "./mappers";
import type { UpAccountResource, UpTransactionResource, UpCategoryResource } from "./types";

const account: UpAccountResource = {
  type: "accounts",
  id: "acc-1",
  attributes: {
    displayName: "Spending",
    accountType: "TRANSACTIONAL",
    ownershipType: "INDIVIDUAL",
    balance: { currencyCode: "AUD", value: "50.00", valueInBaseUnits: 5000 },
    createdAt: "2026-01-01T00:00:00+10:00",
  },
};

function txn(over: Partial<UpTransactionResource["attributes"]> = {}, rels: Partial<UpTransactionResource["relationships"]> = {}): UpTransactionResource {
  return {
    type: "transactions",
    id: "txn-1",
    attributes: {
      status: "SETTLED",
      description: "Coffee",
      message: null,
      rawText: "COFFEE CO",
      amount: { currencyCode: "AUD", value: "-5.50", valueInBaseUnits: -550 },
      foreignAmount: null,
      cardPurchaseMethod: { method: "CONTACTLESS", cardNumberSuffix: "1234" },
      roundUp: null,
      cashback: null,
      note: null,
      settledAt: "2026-06-10T03:00:00Z",
      createdAt: "2026-06-10T02:59:00Z",
      ...over,
    },
    relationships: {
      account: { data: { type: "accounts", id: "acc-1" } },
      transferAccount: { data: null },
      category: { data: { type: "categories", id: "restaurants-and-cafes" } },
      parentCategory: { data: { type: "categories", id: "good-life" } },
      tags: { data: [] },
      attachment: { data: null },
      ...rels,
    },
  };
}

describe("mapAccount", () => {
  it("maps balance from valueInBaseUnits (integer cents, no float)", () => {
    expect(mapAccount(account)).toEqual({
      id: "acc-1", name: "Spending", type: "TRANSACTIONAL", ownership: "INDIVIDUAL", balanceCents: 5000,
    });
  });

  it("maps SAVER + JOINT", () => {
    const r = mapAccount({ ...account, attributes: { ...account.attributes, accountType: "SAVER", ownershipType: "JOINT" } });
    expect(r.type).toBe("SAVER");
    expect(r.ownership).toBe("JOINT");
  });

  it("defaults an unknown accountType to TRANSACTIONAL and unknown ownership to INDIVIDUAL", () => {
    const r = mapAccount({ ...account, attributes: { ...account.attributes, accountType: "MYSTERY", ownershipType: "WEIRD" } });
    expect(r.type).toBe("TRANSACTIONAL");
    expect(r.ownership).toBe("INDIVIDUAL");
  });
});

describe("mapTransaction", () => {
  it("maps amount + foreign amount from valueInBaseUnits and keeps signs", () => {
    const r = mapTransaction(txn({ foreignAmount: { currencyCode: "USD", value: "-3.99", valueInBaseUnits: -399 } }));
    expect(r.amountCents).toBe(-550);
    expect(r.currency).toBe("AUD");
    expect(r.foreignAmountCents).toBe(-399);
    expect(r.foreignCurrency).toBe("USD");
  });

  it("maps relationships, card method, settledAt, and createdAt", () => {
    const r = mapTransaction(txn());
    expect(r.id).toBe("txn-1");
    expect(r.accountId).toBe("acc-1");
    expect(r.categoryId).toBe("restaurants-and-cafes");
    expect(r.parentCategoryId).toBe("good-life");
    expect(r.cardPurchaseMethod).toBe("CONTACTLESS");
    expect(r.cardNumberSuffix).toBe("1234");
    expect(r.settledAt).toBe("2026-06-10T03:00:00Z");
    expect(r.createdAt).toBe("2026-06-10T02:59:00Z");
    expect(r.isTransfer).toBe(false);
    expect(r.transferAccountId).toBeNull();
  });

  it("flags a transfer when transferAccount is present", () => {
    const r = mapTransaction(txn({}, { transferAccount: { data: { type: "accounts", id: "acc-2" } } }));
    expect(r.isTransfer).toBe(true);
    expect(r.transferAccountId).toBe("acc-2");
  });

  it("leaves match-derived flags false and null on import", () => {
    const r = mapTransaction(txn());
    expect(r.isSalary).toBe(false);
    expect(r.isInterest).toBe(false);
    expect(r.isTaxDeductible).toBe(false);
    expect(r.taxDeductionCategory).toBeNull();
  });

  it("maps HELD status and null category", () => {
    const r = mapTransaction(txn({ status: "HELD" }, { category: { data: null }, parentCategory: { data: null } }));
    expect(r.status).toBe("HELD");
    expect(r.categoryId).toBeNull();
    expect(r.parentCategoryId).toBeNull();
  });

  it("maps roundUp/cashback/note from base units", () => {
    const r = mapTransaction(txn({
      roundUp: { amount: { currencyCode: "AUD", value: "-0.50", valueInBaseUnits: -50 } },
      cashback: { description: "cb", amount: { currencyCode: "AUD", value: "1.00", valueInBaseUnits: 100 } },
      note: { text: "zipmoney" },
    }));
    expect(r.roundUpCents).toBe(-50);
    expect(r.cashbackCents).toBe(100);
    expect(r.note).toBe("zipmoney");
  });
});

describe("mapCategory", () => {
  it("maps id, name, and parentId", () => {
    const c: UpCategoryResource = {
      type: "categories", id: "restaurants-and-cafes",
      attributes: { name: "Restaurants & Cafés" },
      relationships: { parent: { data: { type: "categories", id: "good-life" } } },
    };
    expect(mapCategory(c)).toEqual({ id: "restaurants-and-cafes", name: "Restaurants & Cafés", parentId: "good-life" });
  });
});
