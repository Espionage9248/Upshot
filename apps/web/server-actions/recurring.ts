"use server";

/**
 * Recurring Server Actions (auth-guarded wrappers).
 *
 * Security invariants:
 *   - Every action re-checks the session server-side via action(), which
 *     short-circuits an unauthenticated call before any DB access.
 *
 * Pure logic + event_log writes live in `recurring-core.ts`. A "use server"
 * module may export only async functions + `export type` re-exports.
 */

import { revalidatePath } from "next/cache";
import { action } from "@/lib/action";
import { getDb } from "@/lib/db";
import { DrizzleRecurringRepo } from "@upshot/db";
import {
  acceptSuggestion,
  dismissSuggestion,
  pauseRecurring,
  removeRecurring,
  setRecurringKind,
} from "./recurring-core";

/** Action: accept a suggested recurring item → sets status ACTIVE. */
export const acceptSuggestionAction = action(
  async (_session, id: string): Promise<void> => {
    const { db } = getDb();
    await acceptSuggestion(db, id);
    revalidatePath("/plan/recurring");
    revalidatePath("/plan");
  },
);

/** Action: dismiss a suggested recurring item → sets status CANCELLED (NOT delete). */
export const dismissSuggestionAction = action(
  async (_session, id: string): Promise<void> => {
    const { db } = getDb();
    await dismissSuggestion(db, id);
    revalidatePath("/plan/recurring");
    revalidatePath("/plan");
  },
);

/** Action: pause an active recurring item → sets status PAUSED. */
export const pauseRecurringAction = action(
  async (_session, id: string): Promise<void> => {
    const { db } = getDb();
    await pauseRecurring(db, id);
    revalidatePath("/plan/recurring");
    revalidatePath("/plan");
  },
);

/** Action: permanently delete an active or paused recurring item. */
export const deleteRecurringAction = action(
  async (_session, id: string): Promise<void> => {
    const { db } = getDb();
    await removeRecurring(db, id);
    revalidatePath("/plan/recurring");
    revalidatePath("/plan");
  },
);

/** Action: override a recurring item's bill-vs-subscription classification. */
export const setRecurringKindAction = action(
  async (_session, id: string, kind: "BILL" | "SUBSCRIPTION"): Promise<void> => {
    const { db } = getDb();
    await setRecurringKind(db, id, kind);
    revalidatePath("/plan/recurring");
    revalidatePath("/plan");
  },
);

/** Action: manually create a recurring item (status ACTIVE, not auto-detected). */
export const createRecurringAction = action(
  async (
    _session,
    input: {
      name: string;
      amountCents: number;
      frequency: "WEEKLY" | "FORTNIGHTLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
      kind: "BILL" | "SUBSCRIPTION";
    },
  ): Promise<string> => {
    const { db } = getDb();
    const repo = new DrizzleRecurringRepo(db);
    const id = await repo.create({
      name: input.name,
      amountCents: input.amountCents,
      frequency: input.frequency,
      kind: input.kind,
      status: "ACTIVE",
      isAutoDetected: false,
      category: null,
      merchant: null,
      matchRuleId: null,
      accountId: null,
      firstDetectedDate: null,
      lastDetectedDate: null,
      nextExpectedDate: null,
      notes: null,
    });
    revalidatePath("/plan/recurring");
    revalidatePath("/plan/debts");
    return id;
  },
);

