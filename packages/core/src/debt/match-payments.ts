export interface DebtMatcher {
  debtId: string;
  currentBalanceCents: number;
  pattern: RegExp;
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
 * Links bank transactions to debts as payments by description pattern.
 *
 * Key correctness properties:
 * - Only negative (outgoing) non-transfer transactions are matched.
 * - Transactions in `alreadyLinkedTxIds` are never re-matched.
 * - Integer cents only — no parseFloat.
 * - Balance is reduced to a minimum of 0 (never negative).
 * - Emits one DebtBalanceUpdate per matcher that got ≥1 payment.
 */
export function matchDebtPayments(
  matchers: DebtMatcher[],
  transactions: {
    id: string;
    description: string;
    amountCents: number;
    createdAt: string;
    settledAt: string | null;
    isTransfer: boolean;
  }[],
  alreadyLinkedTxIds: Set<string>,
): { payments: DebtPaymentMatch[]; balanceUpdates: DebtBalanceUpdate[] } {
  const payments: DebtPaymentMatch[] = [];
  const balanceUpdates: DebtBalanceUpdate[] = [];

  for (const matcher of matchers) {
    let balanceCents = matcher.currentBalanceCents;
    const matcherPayments: DebtPaymentMatch[] = [];

    for (const tx of transactions) {
      if (tx.isTransfer) continue;
      if (tx.amountCents >= 0) continue;
      if (alreadyLinkedTxIds.has(tx.id)) continue;
      if (!matcher.pattern.test(tx.description)) continue;

      const abs = Math.abs(tx.amountCents);
      matcherPayments.push({
        debtId: matcher.debtId,
        transactionId: tx.id,
        amountCents: abs,
        paidAt: tx.settledAt ?? tx.createdAt,
      });
      balanceCents = Math.max(0, balanceCents - abs);
    }

    if (matcherPayments.length > 0) {
      payments.push(...matcherPayments);
      balanceUpdates.push({ debtId: matcher.debtId, newBalanceCents: balanceCents });
    }
  }

  return { payments, balanceUpdates };
}
