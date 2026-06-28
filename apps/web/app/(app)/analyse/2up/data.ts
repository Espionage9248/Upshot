import { buildOverview, type TwoUpOverview } from "@upshot/core";
import { DrizzleTwoUpRepo, type DbClient } from "@upshot/db";

export function loadTwoUpOverview(db: DbClient): TwoUpOverview {
  return buildOverview(new DrizzleTwoUpRepo(db).list());
}
