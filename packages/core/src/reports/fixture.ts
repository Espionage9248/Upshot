/**
 * Shared deterministic test fixture for Phase 6.1 report snapshot tests.
 *
 * FIXTURE_NOW anchors the "current time" so all derived windows are stable.
 * All amounts are integer cents. All dates are ISO strings.
 */

import type { ReportTxn } from "./salary-periods";

export const FIXTURE_NOW = "2026-03-01T00:00:00.000Z";

/**
 * A representative set of transactions covering:
 * - 2 salary periods (Jan + Feb pay)
 * - Expenses across ≥3 categories (groceries, utilities, dining)
 * - 1 transfer (excluded from income/expense totals)
 * - 1 tagged transaction (tag: "tax-deductible")
 * - 1 tax-deductible transaction (categoryId: "cat-work")
 */
export const REPORT_FIXTURE: ReportTxn[] = [
  // --- Salary period 1: Jan 15 ---
  {
    id: "sal-jan",
    amountCents: 500000,           // $5,000.00 income
    isSalary: true,
    isTransfer: false,
    categoryId: "cat-income",
    parentCategoryId: null,
    settledAt: "2026-01-15T00:00:00.000Z",
    createdAt: "2026-01-14T22:00:00.000Z",
    tags: [],
  },
  // --- Salary period 2: Feb 15 ---
  {
    id: "sal-feb",
    amountCents: 500000,           // $5,000.00 income
    isSalary: true,
    isTransfer: false,
    categoryId: "cat-income",
    parentCategoryId: null,
    settledAt: "2026-02-15T00:00:00.000Z",
    createdAt: "2026-02-14T22:00:00.000Z",
    tags: [],
  },
  // --- Groceries (Jan) ---
  {
    id: "exp-groc-jan-1",
    amountCents: -8500,            // -$85.00
    isSalary: false,
    isTransfer: false,
    categoryId: "cat-groceries",
    parentCategoryId: "cat-living",
    settledAt: "2026-01-18T00:00:00.000Z",
    createdAt: "2026-01-17T10:00:00.000Z",
    tags: [],
  },
  {
    id: "exp-groc-jan-2",
    amountCents: -12300,           // -$123.00
    isSalary: false,
    isTransfer: false,
    categoryId: "cat-groceries",
    parentCategoryId: "cat-living",
    settledAt: "2026-01-25T00:00:00.000Z",
    createdAt: "2026-01-24T10:00:00.000Z",
    tags: [],
  },
  // --- Groceries (Feb) ---
  {
    id: "exp-groc-feb-1",
    amountCents: -9100,            // -$91.00
    isSalary: false,
    isTransfer: false,
    categoryId: "cat-groceries",
    parentCategoryId: "cat-living",
    settledAt: "2026-02-20T00:00:00.000Z",
    createdAt: "2026-02-19T10:00:00.000Z",
    tags: [],
  },
  // --- Utilities (Jan) ---
  {
    id: "exp-util-jan",
    amountCents: -22000,           // -$220.00
    isSalary: false,
    isTransfer: false,
    categoryId: "cat-utilities",
    parentCategoryId: "cat-living",
    settledAt: "2026-01-20T00:00:00.000Z",
    createdAt: "2026-01-19T08:00:00.000Z",
    tags: [],
  },
  // --- Utilities (Feb) ---
  {
    id: "exp-util-feb",
    amountCents: -21500,           // -$215.00
    isSalary: false,
    isTransfer: false,
    categoryId: "cat-utilities",
    parentCategoryId: "cat-living",
    settledAt: "2026-02-22T00:00:00.000Z",
    createdAt: "2026-02-21T08:00:00.000Z",
    tags: [],
  },
  // --- Dining (Jan) ---
  {
    id: "exp-dining-jan",
    amountCents: -6500,            // -$65.00
    isSalary: false,
    isTransfer: false,
    categoryId: "cat-dining",
    parentCategoryId: "cat-lifestyle",
    settledAt: "2026-01-22T00:00:00.000Z",
    createdAt: "2026-01-21T19:00:00.000Z",
    tags: [],
  },
  // --- Work expense — tax-deductible (Feb), tagged ---
  {
    id: "exp-work-feb",
    amountCents: -45000,           // -$450.00 — home office equipment
    isSalary: false,
    isTransfer: false,
    categoryId: "cat-work",
    parentCategoryId: "cat-work",
    settledAt: "2026-02-10T00:00:00.000Z",
    createdAt: "2026-02-09T14:00:00.000Z",
    tags: ["tax-deductible"],
  },
  // --- Transfer (excluded from income/expense analysis) ---
  {
    id: "txfr-saver",
    amountCents: -100000,          // $1,000.00 into savings — should be excluded
    isSalary: false,
    isTransfer: true,
    categoryId: null,
    parentCategoryId: null,
    settledAt: "2026-01-16T00:00:00.000Z",
    createdAt: "2026-01-16T00:00:00.000Z",
    tags: [],
  },
];

// ---------------------------------------------------------------------------
// Sanity assertions (values confirmed against fixture above)
// ---------------------------------------------------------------------------

/** Total number of transactions in the fixture. */
export const FIXTURE_TXN_COUNT = REPORT_FIXTURE.length; // 10

/** Total salary income cents (sum of isSalary amountCents). */
export const FIXTURE_TOTAL_INCOME_CENTS = 1_000_000; // 2 × $5,000 = $10,000
