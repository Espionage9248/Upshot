DELETE FROM `installment_plan_payments`
WHERE `rowid` NOT IN (
  SELECT MIN(`rowid`) FROM `installment_plan_payments` GROUP BY `transaction_id`
);
--> statement-breakpoint
CREATE UNIQUE INDEX `installment_plan_payments_transactionId_unique` ON `installment_plan_payments` (`transaction_id`);