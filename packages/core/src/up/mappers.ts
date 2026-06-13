import type { Category } from "@upshot/contracts";
import type { NewTransaction } from "../ports/transaction-repo";
import type {
  MappedAccount, UpAccountResource, UpCategoryResource, UpTransactionResource,
} from "./types";

const ACCOUNT_TYPE_VALUES = ["SAVER", "TRANSACTIONAL", "HOME_LOAN"] as const;

export function mapAccount(r: UpAccountResource): MappedAccount {
  const type = (ACCOUNT_TYPE_VALUES as readonly string[]).includes(r.attributes.accountType)
    ? (r.attributes.accountType as MappedAccount["type"])
    : "TRANSACTIONAL";
  const ownership = r.attributes.ownershipType === "JOINT" ? "JOINT" : "INDIVIDUAL";
  return {
    id: r.id,
    name: r.attributes.displayName,
    type,
    ownership,
    balanceCents: r.attributes.balance.valueInBaseUnits,
  };
}

export function mapTransaction(r: UpTransactionResource): NewTransaction {
  const a = r.attributes;
  const transferData = r.relationships.transferAccount.data;
  return {
    id: r.id,
    accountId: r.relationships.account.data.id,
    status: a.status === "HELD" ? "HELD" : "SETTLED",
    description: a.description ?? "",
    message: a.message ?? null,
    rawText: a.rawText ?? null,
    amountCents: a.amount.valueInBaseUnits,
    currency: a.amount.currencyCode,
    foreignAmountCents: a.foreignAmount?.valueInBaseUnits ?? null,
    foreignCurrency: a.foreignAmount?.currencyCode ?? null,
    categoryId: r.relationships.category.data?.id ?? null,
    parentCategoryId: r.relationships.parentCategory.data?.id ?? null,
    isTransfer: transferData !== null,
    transferAccountId: transferData?.id ?? null,
    isSalary: false,
    isInterest: false,
    isTaxDeductible: false,
    taxDeductionCategory: null,
    cardPurchaseMethod: a.cardPurchaseMethod?.method ?? null,
    cardNumberSuffix: a.cardPurchaseMethod?.cardNumberSuffix ?? null,
    roundUpCents: a.roundUp?.amount.valueInBaseUnits ?? null,
    cashbackCents: a.cashback?.amount.valueInBaseUnits ?? null,
    note: a.note?.text ?? null,
    attachmentId: r.relationships.attachment?.data?.id ?? null,
    attachmentUrl: null,
    settledAt: a.settledAt ?? null,
    createdAt: a.createdAt,
  };
}

export function mapCategory(r: UpCategoryResource): Category {
  return {
    id: r.id,
    name: r.attributes.name,
    parentId: r.relationships.parent.data?.id ?? null,
  };
}
