import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/sqlite-core";
import { toSnakeCase } from "drizzle-orm/casing";
import { schema } from "./schema";
import { accounts } from "./schema/accounts";
import { transactions } from "./schema/transactions";
import { debts } from "./schema/debts";

describe("schema wiring", () => {
  it("exposes every expected table on the schema object", () => {
    const names = Object.values(schema).map((t) => getTableConfig(t as never).name).sort();
    expect(names).toEqual(
      [
        "account", "accounts", "app_settings", "asset_valuations", "assets", "budget_allocations",
        "categories", "dashboard_widgets", "debt_expenses", "debt_payments", "debts", "event_log",
        "installment_plan_payments", "installment_plans", "job_runs", "match_actions",
        "match_conditions", "match_rules", "monthly_snapshot_categories", "monthly_snapshots",
        "passkey", "payoff_plan", "planning_scenarios", "purchase_images", "purchases",
        "recurring_items", "session", "tags",
        "transaction_tags", "transactions", "two_up_transactions", "user", "verification",
      ].sort(),
    );
  });

  it("maps camelCase keys to snake_case columns", () => {
    const cols = getTableConfig(accounts).columns.map((c) => toSnakeCase(c.name));
    expect(cols).toContain("balance_cents");
    expect(cols).toContain("monthly_allocation_cents");
  });

  it("indexes the hot transaction columns", () => {
    const idx = getTableConfig(transactions).indexes.map((i) => i.config.name);
    expect(idx).toContain("transactions_account_idx");
    expect(idx).toContain("transactions_created_idx");
  });

  it("debts carries the payments-linked-at column", () => {
    const cols = getTableConfig(debts).columns.map((c) => toSnakeCase(c.name));
    expect(cols).toContain("payments_linked_at");
  });
});
