export type Frequency = "WEEKLY" | "FORTNIGHTLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";

export interface DetectableTransaction {
  description: string;
  amountCents: number;
  date: string; // ISO date string YYYY-MM-DD
  categoryName: string | null;
  accountId: string;
  isTransfer: boolean;
  isSalary: boolean;
}

export interface DetectedRecurring {
  descriptionPattern: string;
  displayName: string;
  amountCents: number;
  frequency: Frequency;
  category: string | null;
  merchant: string;
  accountId: string;
  firstDate: string;
  lastDate: string;
  nextExpectedDate: string;
}

export interface DriftResult {
  changed: boolean;
  newAmountCents: number;
  previousAmountCents: number | null;
}

export interface OverlapGroup {
  groupKey: string;
  itemIds: string[];
}
