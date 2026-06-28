import { DrizzleTwoUpRepo, type DbClient } from "@upshot/db";
import type { TwoUpTxn } from "@upshot/core";

export function loadTwoUpLedger(db: DbClient): TwoUpTxn[] {
  const rows = new DrizzleTwoUpRepo(db).list();
  // Sort date DESC; filterLedger also sorts, but we want a stable order here
  // for the full list passed to the client view.
  return rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}
