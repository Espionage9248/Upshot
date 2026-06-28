import { DrizzleTwoUpRepo, type DbClient } from "@upshot/db";
import type { Owner } from "@upshot/core";

export interface UpdateTwoUpAttributionInput {
  id: string;
  owner?: Owner;
  category?: string | null;
}

export async function updateTwoUpAttribution(
  db: DbClient,
  input: UpdateTwoUpAttributionInput,
): Promise<void> {
  new DrizzleTwoUpRepo(db).updateAttribution(input.id, {
    owner: input.owner,
    category: input.category,
  });
}
