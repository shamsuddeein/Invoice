CREATE TABLE `business` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '',
	`phone` text DEFAULT '',
	`address` text DEFAULT '',
	`logo` text DEFAULT '',
	`bank_name` text DEFAULT '',
	`account_number` text DEFAULT '',
	`account_name` text DEFAULT '',
	`tax_rate` real DEFAULT 0,
	`invoice_prefix` text DEFAULT 'INV',
	`receipt_prefix` text DEFAULT 'RCPT',
	`next_invoice_number` integer DEFAULT 1,
	`next_receipt_number` integer DEFAULT 1,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text DEFAULT '',
	`phone` text DEFAULT '',
	`address` text DEFAULT '',
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `invoice_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_id` integer NOT NULL,
	`description` text NOT NULL,
	`quantity` real DEFAULT 1 NOT NULL,
	`unit_price` real DEFAULT 0 NOT NULL,
	`line_total` real DEFAULT 0 NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_number` text NOT NULL,
	`client_id` integer NOT NULL,
	`issue_date` text NOT NULL,
	`due_date` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`notes` text DEFAULT '',
	`subtotal` real DEFAULT 0 NOT NULL,
	`tax_rate` real DEFAULT 0,
	`tax_amount` real DEFAULT 0,
	`total_amount` real DEFAULT 0 NOT NULL,
	`amount_paid` real DEFAULT 0,
	`balance_due` real DEFAULT 0,
	`created_at` text NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_id` integer NOT NULL,
	`receipt_number` text NOT NULL,
	`amount_paid` real NOT NULL,
	`payment_date` text NOT NULL,
	`payment_method` text NOT NULL,
	`reference_number` text DEFAULT '',
	`note` text DEFAULT '',
	`created_at` text NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_invoice_number_unique` ON `invoices` (`invoice_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `payments_receipt_number_unique` ON `payments` (`receipt_number`);