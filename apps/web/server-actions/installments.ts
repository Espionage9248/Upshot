"use server";

/**
 * Installment Plan Server Actions (auth-guarded wrappers).
 *
 * Security invariants:
 *   - Every action re-checks the session server-side via action(), which
 *     short-circuits an unauthenticated call before any DB access.
 *
 * Pure logic + event_log writes live in `installments-core.ts`. A "use server"
 * module may export only async functions + `export type` re-exports.
 */

import { revalidatePath } from "next/cache";
import { action } from "@/lib/action";
import { getDb } from "@/lib/db";
import { createInstallmentPlan, deleteInstallmentPlan } from "./installments-core";
import type { CreateInstallmentInput, InstallmentRow } from "./installments-core";

export type { InstallmentRow };

/** Action: mark a purchase as a BNPL installment plan. Returns the new plan id. */
export const createInstallmentPlanAction = action(
  async (_session, input: CreateInstallmentInput): Promise<string> => {
    const { db } = getDb();
    const id = await createInstallmentPlan(db, input);
    revalidatePath("/plan/installments");
    revalidatePath("/plan");
    return id;
  },
);

/** Action: delete an installment plan. */
export const deleteInstallmentPlanAction = action(
  async (_session, id: string): Promise<void> => {
    const { db } = getDb();
    await deleteInstallmentPlan(db, id);
    revalidatePath("/plan/installments");
    revalidatePath("/plan");
  },
);
