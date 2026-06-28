"use server";

import { revalidatePath } from "next/cache";
import { action } from "@/lib/action";
import { getDb } from "@/lib/db";
import { updateTwoUpAttribution, type UpdateTwoUpAttributionInput } from "./two-up-core";

export type { UpdateTwoUpAttributionInput } from "./two-up-core";

export const updateTwoUpAttributionAction = action(
  async (_session, input: UpdateTwoUpAttributionInput): Promise<void> => {
    const { db } = getDb();
    await updateTwoUpAttribution(db, input);
    revalidatePath("/analyse/2up");
    revalidatePath("/analyse/2up/ledger");
  },
);
