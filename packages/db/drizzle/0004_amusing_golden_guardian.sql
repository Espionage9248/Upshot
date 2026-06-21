CREATE TABLE `payoff_plan` (
	`id` text PRIMARY KEY NOT NULL,
	`strategy` text NOT NULL,
	`extra_payment_cents` integer NOT NULL,
	`custom_order` text,
	`lump_sums` text NOT NULL,
	`locked_at` text NOT NULL,
	`projected_debt_free_month` text,
	`projected_curve` text NOT NULL,
	`total_interest_projected_cents` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `planning_scenarios` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`inputs` text NOT NULL
);
