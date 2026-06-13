CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`ownership` text NOT NULL,
	`balance_cents` integer NOT NULL,
	`role` text NOT NULL,
	`monthly_allocation_cents` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`last_synced_at` text
);
--> statement-breakpoint
CREATE INDEX `accounts_type_idx` ON `accounts` (`type`);--> statement-breakpoint
CREATE INDEX `accounts_role_idx` ON `accounts` (`role`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`parent_id` text
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`status` text NOT NULL,
	`description` text NOT NULL,
	`message` text,
	`raw_text` text,
	`amount_cents` integer NOT NULL,
	`currency` text DEFAULT 'AUD' NOT NULL,
	`foreign_amount_cents` integer,
	`foreign_currency` text,
	`category_id` text,
	`parent_category_id` text,
	`is_transfer` integer DEFAULT false NOT NULL,
	`transfer_account_id` text,
	`is_salary` integer DEFAULT false NOT NULL,
	`is_interest` integer DEFAULT false NOT NULL,
	`is_tax_deductible` integer DEFAULT false NOT NULL,
	`tax_deduction_category` text,
	`card_purchase_method` text,
	`card_number_suffix` text,
	`round_up_cents` integer,
	`cashback_cents` integer,
	`note` text,
	`attachment_id` text,
	`attachment_url` text,
	`settled_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `transactions_account_idx` ON `transactions` (`account_id`);--> statement-breakpoint
CREATE INDEX `transactions_status_idx` ON `transactions` (`status`);--> statement-breakpoint
CREATE INDEX `transactions_created_idx` ON `transactions` (`created_at`);--> statement-breakpoint
CREATE INDEX `transactions_category_idx` ON `transactions` (`category_id`);--> statement-breakpoint
CREATE INDEX `transactions_salary_idx` ON `transactions` (`is_salary`);--> statement-breakpoint
CREATE INDEX `transactions_transfer_idx` ON `transactions` (`is_transfer`);--> statement-breakpoint
CREATE INDEX `transactions_interest_idx` ON `transactions` (`is_interest`);--> statement-breakpoint
CREATE INDEX `transactions_deductible_idx` ON `transactions` (`is_tax_deductible`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transaction_tags` (
	`transaction_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`transaction_id`, `tag_id`),
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `match_actions` (
	`id` text PRIMARY KEY NOT NULL,
	`rule_id` text NOT NULL,
	`type` text NOT NULL,
	`value` text,
	`target_id` text,
	FOREIGN KEY (`rule_id`) REFERENCES `match_rules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `match_conditions` (
	`id` text PRIMARY KEY NOT NULL,
	`rule_id` text NOT NULL,
	`field` text NOT NULL,
	`mode` text NOT NULL,
	`value` text NOT NULL,
	`amount_cents` integer,
	`tolerance_cents` integer,
	`currency` text,
	FOREIGN KEY (`rule_id`) REFERENCES `match_rules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `match_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`priority` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `budget_allocations` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`month` text NOT NULL,
	`year` integer NOT NULL,
	`allocated_cents` integer NOT NULL,
	`spent_cents` integer DEFAULT 0 NOT NULL,
	`variance_cents` integer NOT NULL,
	`notes` text,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `budget_account_month_uq` ON `budget_allocations` (`account_id`,`month`);--> statement-breakpoint
CREATE INDEX `budget_month_idx` ON `budget_allocations` (`month`);--> statement-breakpoint
CREATE INDEX `budget_year_idx` ON `budget_allocations` (`year`);--> statement-breakpoint
CREATE TABLE `debt_expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`debt_id` text NOT NULL,
	`description` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`merchant` text,
	`note` text,
	`date` text NOT NULL,
	FOREIGN KEY (`debt_id`) REFERENCES `debts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `debt_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`debt_id` text NOT NULL,
	`transaction_id` text,
	`amount_cents` integer NOT NULL,
	`principal_cents` integer,
	`interest_cents` integer,
	`payment_date` text NOT NULL,
	`notes` text,
	FOREIGN KEY (`debt_id`) REFERENCES `debts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `debts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`current_balance_cents` integer NOT NULL,
	`original_balance_cents` integer,
	`credit_limit_cents` integer,
	`monthly_payment_cents` integer NOT NULL,
	`minimum_payment_cents` integer,
	`interest_rate` real,
	`monthly_fee_cents` integer,
	`fee_due_day` integer,
	`last_fee_applied_at` text,
	`payoff_priority` integer DEFAULT 999 NOT NULL,
	`include_in_snowball` integer DEFAULT true NOT NULL,
	`include_in_net_worth` integer DEFAULT true NOT NULL,
	`match_rule_id` text,
	`account_number` text,
	`institution_name` text,
	`notes` text,
	`estimated_payoff_date` text,
	`months_remaining` integer,
	`total_interest_projected_cents` integer,
	FOREIGN KEY (`match_rule_id`) REFERENCES `match_rules`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `debts_type_idx` ON `debts` (`type`);--> statement-breakpoint
CREATE INDEX `debts_priority_idx` ON `debts` (`payoff_priority`);--> statement-breakpoint
CREATE TABLE `installment_plan_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`plan_id` text NOT NULL,
	`transaction_id` text NOT NULL,
	`due_index` integer NOT NULL,
	`paid_at` text NOT NULL,
	FOREIGN KEY (`plan_id`) REFERENCES `installment_plans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `installment_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`merchant` text NOT NULL,
	`total_cents` integer NOT NULL,
	`installment_cents` integer NOT NULL,
	`total_installments` integer NOT NULL,
	`installments_paid` integer DEFAULT 0 NOT NULL,
	`frequency_days` integer DEFAULT 14 NOT NULL,
	`first_due_date` text NOT NULL,
	`next_due_date` text NOT NULL,
	`status` text NOT NULL,
	`match_rule_id` text,
	`notes` text,
	FOREIGN KEY (`match_rule_id`) REFERENCES `match_rules`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `recurring_items` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`frequency` text NOT NULL,
	`last_amount_cents` integer,
	`price_last_changed_at` text,
	`usage_count` integer DEFAULT 0 NOT NULL,
	`usage_reset_at` text,
	`category` text,
	`merchant` text,
	`status` text NOT NULL,
	`match_rule_id` text,
	`next_expected_date` text,
	`last_detected_date` text,
	`first_detected_date` text,
	`account_id` text,
	`is_auto_detected` integer DEFAULT false NOT NULL,
	`notes` text,
	FOREIGN KEY (`match_rule_id`) REFERENCES `match_rules`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `recurring_status_idx` ON `recurring_items` (`status`);--> statement-breakpoint
CREATE INDEX `recurring_next_idx` ON `recurring_items` (`next_expected_date`);--> statement-breakpoint
CREATE TABLE `purchase_images` (
	`id` text PRIMARY KEY NOT NULL,
	`purchase_id` text NOT NULL,
	`url` text NOT NULL,
	FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `purchases` (
	`id` text PRIMARY KEY NOT NULL,
	`custom_name` text,
	`status` text NOT NULL,
	`transaction_id` text,
	`price_cents` integer,
	`currency` text DEFAULT 'AUD' NOT NULL,
	`merchant` text,
	`category` text,
	`purchase_date` text,
	`target_date` text,
	`target_price_cents` integer,
	`priority` integer,
	`url` text,
	`notes` text,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `purchases_transactionId_unique` ON `purchases` (`transaction_id`);--> statement-breakpoint
CREATE TABLE `app_settings` (
	`id` text PRIMARY KEY DEFAULT 'default' NOT NULL,
	`sync_cadence` text DEFAULT 'DAILY' NOT NULL,
	`wifi_only_sync` integer DEFAULT false NOT NULL,
	`background_refresh` integer DEFAULT true NOT NULL,
	`notify_on_sync_fail` integer DEFAULT true NOT NULL,
	`auto_detect_recurring` integer DEFAULT true NOT NULL,
	`auto_categorise` integer DEFAULT true NOT NULL,
	`nightly_backup` integer DEFAULT true NOT NULL,
	`debt_strategy` text DEFAULT 'SNOWBALL' NOT NULL,
	`extra_payment_cents` integer DEFAULT 0 NOT NULL,
	`big_purchase_threshold_cents` integer DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'AUD' NOT NULL,
	`date_format` text DEFAULT 'DD/MM/YYYY' NOT NULL,
	`financial_year_start_month` integer DEFAULT 7 NOT NULL,
	`medicare_levy_applies` integer DEFAULT true NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `monthly_snapshot_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`snapshot_id` text NOT NULL,
	`category_name` text NOT NULL,
	`amount_cents` integer NOT NULL,
	FOREIGN KEY (`snapshot_id`) REFERENCES `monthly_snapshots`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `monthly_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`month` text NOT NULL,
	`income_cents` integer NOT NULL,
	`expense_cents` integer NOT NULL,
	`saved_cents` integer NOT NULL,
	`debt_cents` integer NOT NULL,
	`assets_cents` integer NOT NULL,
	`net_worth_cents` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `snapshots_month_uq` ON `monthly_snapshots` (`month`);--> statement-breakpoint
CREATE TABLE `dashboard_widgets` (
	`id` text PRIMARY KEY NOT NULL,
	`widget_key` text NOT NULL,
	`position` integer NOT NULL,
	`size` text NOT NULL,
	`visible` integer DEFAULT true NOT NULL,
	`config` text
);
--> statement-breakpoint
CREATE TABLE `event_log` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text,
	`entity_id` text,
	`entity_name` text,
	`description` text NOT NULL,
	`before` text,
	`after` text,
	`meta` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `job_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`job` text NOT NULL,
	`status` text NOT NULL,
	`started_at` text NOT NULL,
	`finished_at` text,
	`cursor` text,
	`counts` text,
	`error` text,
	`attempt` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `two_up_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`row_hash` text NOT NULL,
	`date` text NOT NULL,
	`description` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`contributor` text,
	`category` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `two_up_rowhash_uq` ON `two_up_transactions` (`row_hash`);--> statement-breakpoint
CREATE TABLE `asset_valuations` (
	`id` text PRIMARY KEY NOT NULL,
	`asset_id` text NOT NULL,
	`value_cents` integer NOT NULL,
	`valued_at` text NOT NULL,
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `assets` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`value_cents` integer NOT NULL,
	`institution` text,
	`notes` text,
	`include_in_net_worth` integer DEFAULT true NOT NULL,
	`last_valued_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `assets_type_idx` ON `assets` (`type`);