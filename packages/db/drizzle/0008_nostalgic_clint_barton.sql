ALTER TABLE `app_settings` ADD `taxable_income_gross_cents` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `payg_withheld_cents` integer DEFAULT 0 NOT NULL;