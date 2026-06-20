import type { InstallmentPlan } from "@upshot/contracts";
import type { InstallmentMatch, PlanUpdate } from "../installments";

/** New-plan input: computed/optional fields omitted (or overrideable). */
export type NewInstallmentPlan = Omit<InstallmentPlan, "id" | "installmentsPaid" | "nextDueDate" | "status">
  & { id?: string; installmentsPaid?: number; nextDueDate?: string; status?: "ACTIVE" | "COMPLETE" };

export interface InstallmentRepo {
  list(): Promise<InstallmentPlan[]>;
  getById(id: string): Promise<InstallmentPlan | null>;
  create(input: NewInstallmentPlan): Promise<string>;
  applyMatches(updates: PlanUpdate[], payments: InstallmentMatch[]): Promise<void>;
  listLinkedTransactionIds(): Promise<Set<string>>;
  delete(id: string): Promise<void>;
}
