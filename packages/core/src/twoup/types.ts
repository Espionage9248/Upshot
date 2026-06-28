export type Owner =
  | "JAMES" | "BRITTNEY" | "INTEREST" | "REVERSAL" | "UNASSIGNED" | "SHARED";

export interface PositionedText { x: number; y: number; str: string }
export interface RawRow { date: string; time: string; description: string; amountCents: number; balanceCents: number }
export interface StatementSummary { openingCents: number; moneyInCents: number; moneyOutCents: number; closingCents: number }
export interface TwoUpTxn { id: string; rowHash: string; date: string; description: string; amountCents: number; owner: Owner; category: string | null }
