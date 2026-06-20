import type { AccountType, AccountOwnership } from "@upshot/contracts";

/** Up MoneyObject. valueInBaseUnits is signed integer cents — use it, never parseFloat(value). */
export interface UpMoney {
  currencyCode: string;
  value: string;
  valueInBaseUnits: number;
}

export interface UpRelationshipData {
  type: string;
  id: string;
}

export interface UpAccountResource {
  type: "accounts";
  id: string;
  attributes: {
    displayName: string;
    accountType: string;
    ownershipType: string;
    balance: UpMoney;
    createdAt: string;
  };
}

export interface UpTransactionResource {
  type: "transactions";
  id: string;
  attributes: {
    status: string;
    description: string;
    message: string | null;
    rawText: string | null;
    amount: UpMoney;
    foreignAmount: UpMoney | null;
    cardPurchaseMethod: { method: string; cardNumberSuffix: string | null } | null;
    roundUp: { amount: UpMoney } | null;
    cashback: { description: string; amount: UpMoney } | null;
    note: { text: string } | null;
    settledAt: string | null;
    createdAt: string;
  };
  relationships: {
    account: { data: UpRelationshipData };
    transferAccount: { data: UpRelationshipData | null };
    category: { data: UpRelationshipData | null };
    parentCategory: { data: UpRelationshipData | null };
    tags: { data: UpRelationshipData[] };
    attachment?: { data: UpRelationshipData | null };
  };
}

export interface UpCategoryResource {
  type: "categories";
  id: string;
  attributes: { name: string };
  relationships: { parent: { data: UpRelationshipData | null } };
}

export interface UpListResponse<T> {
  data: T[];
  links: { prev: string | null; next: string | null };
}

/** Maps an Up accountType (SAVER | TRANSACTIONAL | HOME_LOAN) to our enum. */
export type MappedAccount = {
  id: string;
  name: string;
  type: AccountType;
  ownership: AccountOwnership;
  balanceCents: number;
};

export interface UpClientPort {
  /** Throws UpAuthError on 401/403; resolves on success. */
  ping(): Promise<void>;
  listAccounts(): Promise<UpAccountResource[]>;
  listTransactions(opts?: { since?: string }): Promise<UpTransactionResource[]>;
  listCategories(): Promise<UpCategoryResource[]>;
  addTag(transactionId: string, tagId: string): Promise<void>;
  setCategory(transactionId: string, categoryId: string | null): Promise<void>;
}

export class UpHttpError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
    message: string,
    readonly retryAfterMs?: number,
  ) {
    super(message);
    this.name = "UpHttpError";
  }
}

export class UpAuthError extends UpHttpError {
  constructor(status: number, path: string) {
    super(status, path, `Up API auth failed (HTTP ${status})`);
    this.name = "UpAuthError";
  }
}
