export const ACCOUNT_TYPES = ["TRANSACTIONAL", "SAVER", "HOME_LOAN"] as const;
export const ACCOUNT_OWNERSHIPS = ["INDIVIDUAL", "JOINT"] as const;
export const ACCOUNT_ROLES = ["SPENDING", "SAVER", "ESSENTIALS", "EMERGENCY", "NONE"] as const;

export const TRANSACTION_STATUSES = ["HELD", "SETTLED"] as const;

export const DEBT_TYPES = ["PERSONAL_LOAN", "CREDIT_CARD", "MORTGAGE", "CAR", "TAX", "OVERDRAFT"] as const;
export const INSTALLMENT_STATUSES = ["ACTIVE", "COMPLETE"] as const;

export const RECURRING_KINDS = ["BILL", "SUBSCRIPTION"] as const;
export const RECURRING_FREQUENCIES = ["WEEKLY", "FORTNIGHTLY", "MONTHLY", "QUARTERLY", "YEARLY"] as const;
export const RECURRING_STATUSES = ["ACTIVE", "PAUSED", "CANCELLED", "SUGGESTED"] as const;

export const PURCHASE_STATUSES = ["WISHLIST", "PURCHASED"] as const;

export const MATCH_FIELDS = ["description", "categoryName", "rawText"] as const;
export const MATCH_MODES = ["contains", "startsWith", "exact", "regex"] as const;
export const MATCH_ACTION_TYPES = [
  "RENAME", "APPLY_TAG", "SET_CATEGORY", "MARK_SALARY", "MARK_TRANSFER", "MARK_INTEREST",
  "MARK_DEDUCTIBLE", "IGNORE_SUBSCRIPTION", "LINK_DEBT", "LINK_RECURRING", "LINK_INSTALLMENT",
] as const;

export const SYNC_CADENCES = ["REALTIME", "HOURLY", "DAILY"] as const;

export const JOB_NAMES = ["SYNC", "FEES", "DETECT", "BACKUP"] as const;
export const JOB_STATUSES = ["RUNNING", "SUCCESS", "FAILED"] as const;

export const ASSET_TYPES = ["INVESTMENT", "SUPER", "PROPERTY", "VEHICLE", "CASH", "OTHER"] as const;
