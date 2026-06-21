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
import {
  acceptSuggestion,
  dismissSuggestion,
  pauseRecurring,
  removeRecurring,
  setUsage,
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

/** Action: update the manual usage tally for a recurring item. */
export const setUsageAction = action(
  async (_session, id: string, usageCount: number): Promise<void> => {
    const { db } = getDb();
    await setUsage(db, id, usageCount);
    revalidatePath("/plan/recurring");
    revalidatePath("/plan");
  },
);
