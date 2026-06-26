import type { MatchCondition } from "@upshot/contracts";
import { evaluateCondition, type MatchTarget } from "../match/engine";

export interface DebtMatcher {
  debtId: string;
  currentBalanceCents: number;
  conditions: MatchCondition[];
  linkedAt: string | null;
}

export interface DebtPaymentMatch {
  debtId: string;
  transactionId: string;
  amountCents: number;
  paidAt: string;
}

export interface DebtBalanceUpdate {
  debtId: string;
  newBalanceCents: number;
}

/** Escapes each pattern string for regex special characters, ORs them together, case-insensitive. */
export function compilePatternRegex(patterns: string[]): RegExp {
  return new RegExp(
    patterns.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
    "i",
  );
}

/**
 * Links bank transactions to debts as payments by evaluating all match
 * conditions through the unified rules engine (description, rawText,
 * amount, currency, etc.).
 *
 * Key correctness properties:
 * - Only negative (outgoing) non-transfer transactions are matched.
 * - Transactions in `alreadyLinkedTxIds` are never re-matched.
 * - A debt with zero conditions matches nothing.
 * - Integer cents only — no parseFloat.
 * - Balance is reduced to a minimum of 0 (never negative).
 * - Emits one DebtBalanceUpdate per matcher that got ≥1 payment.
 *
 * `decrementSince` (YYYY-MM-DD, optional) is an extra floor on the BALANCE
 * DECREMENT only — payments dated before it are still recorded as history but
 * never draw down the balance. This lets a caller record the full transaction
 * history (for a complete payments surface) while keeping the decrement scoped
 * to a recent window, so widening the record set never widens the decrement.
 * Omit (or pass null) for no extra cap.
 */
export function matchDebtPayments(
  matchers: DebtMatcher[],
  transactions: {
    id: string;
    description: string;
    rawText: string | null;
    note: string | null;
    amountCents: number;
    currency: string;
    foreignAmountCents: number | null;
    foreignCurrency: string | null;
    categoryName: string | null;
    createdAt: string;
    settledAt: string | null;
    isTransfer: boolean;
  }[],
  alreadyLinkedTxIds: Set<string>,
  decrementSince: string | null = null,
): { payments: DebtPaymentMatch[]; balanceUpdates: DebtBalanceUpdate[] } {
  const payments: DebtPaymentMatch[] = [];
  const balanceUpdates: DebtBalanceUpdate[] = [];

  for (const matcher of matchers) {
    if (matcher.conditions.length === 0) continue;

    let balanceCents = matcher.currentBalanceCents;
    const matcherPayments: DebtPaymentMatch[] = [];

    for (const tx of transactions) {
      if (tx.isTransfer) continue;
      if (tx.amountCents >= 0) continue;
      if (alreadyLinkedTxIds.has(tx.id)) continue;

      const target: MatchTarget = {
        description: tx.description,
        rawText: tx.rawText,
        note: tx.note,
        amountCents: tx.amountCents,
        currency: tx.currency,
        foreignAmountCents: tx.foreignAmountCents,
        foreignCurrency: tx.foreignCurrency,
        categoryName: tx.categoryName,
      };

      if (!matcher.conditions.every((c) => evaluateCondition(c, target))) continue;

      const abs = Math.abs(tx.amountCents);
      const paidAt = tx.settledAt ?? tx.createdAt;
      matcherPayments.push({
        debtId: matcher.debtId,
        transactionId: tx.id,
        amountCents: abs,
        paidAt,
      });
      // Forward-only: only payments dated on/after the link date draw down the typed balance.
      // History (matcherPayments) is always recorded; a null linkedAt never decrements.
      // `decrementSince` is an additional recent-window floor so recording full history
      // never widens the decrement (payments before it are recorded but don't draw down).
      const paidDate = paidAt.slice(0, 10);
      if (
        matcher.linkedAt !== null &&
        paidDate >= matcher.linkedAt &&
        (decrementSince === null || paidDate >= decrementSince)
      ) {
        balanceCents = Math.max(0, balanceCents - abs);
      }
    }

    if (matcherPayments.length > 0) {
      payments.push(...matcherPayments);
      balanceUpdates.push({ debtId: matcher.debtId, newBalanceCents: balanceCents });
    }
  }

  return { payments, balanceUpdates };
}
