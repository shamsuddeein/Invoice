ALTER TABLE `payments` ADD COLUMN `invoice_total_snapshot` real;
--> statement-breakpoint
ALTER TABLE `payments` ADD COLUMN `paid_through_snapshot` real;
--> statement-breakpoint
ALTER TABLE `payments` ADD COLUMN `balance_snapshot` real;
