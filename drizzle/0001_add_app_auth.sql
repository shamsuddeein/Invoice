CREATE TABLE IF NOT EXISTS `app_auth` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`password_hash` text NOT NULL,
	`updated_at` text
);
