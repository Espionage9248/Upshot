export interface PlannerPreview {
  scenario: { month: string; balanceCents: number }[];
  baseline: { month: string; balanceCents: number }[];
  perDebt: { id: string; clearedMonth: string | null }[];
  scenarioDebtFree: string | null;
  baselineDebtFree: string | null;
  extraPaymentCents: number;
  achievable: boolean;
  headroomCents: number;
  overHeadroom: boolean;
  interestSavedCents: number;
  monthsSaved: number;
}
