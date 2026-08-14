CREATE TABLE `action` (
	`id` text PRIMARY KEY NOT NULL,
	`group_id` text NOT NULL,
	`created_by` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`location_name` text NOT NULL,
	`location_address` text,
	`lat` real,
	`lon` real,
	`min_participants` integer,
	`min_decision_at` integer,
	`max_participants` integer,
	`published_at` integer,
	`completed_at` integer,
	`cancelled_at` integer,
	`cancel_reason` text,
	`duplicated_from` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `action_group_status_start_idx` ON `action` (`group_id`,`status`,`starts_at`);--> statement-breakpoint
CREATE INDEX `action_start_idx` ON `action` (`starts_at`);--> statement-breakpoint
CREATE TABLE `action_equipment` (
	`id` text PRIMARY KEY NOT NULL,
	`action_id` text NOT NULL,
	`group_id` text NOT NULL,
	`label` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`tool_id` text,
	`brought_by` text,
	`loan_id` text,
	FOREIGN KEY (`action_id`) REFERENCES `action`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`brought_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `action_equipment_action_idx` ON `action_equipment` (`action_id`);--> statement-breakpoint
CREATE TABLE `action_task` (
	`id` text PRIMARY KEY NOT NULL,
	`action_id` text NOT NULL,
	`group_id` text NOT NULL,
	`title` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`assignee_user_id` text,
	`done_at` integer,
	`done_by` text,
	FOREIGN KEY (`action_id`) REFERENCES `action`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assignee_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`done_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `action_task_action_idx` ON `action_task` (`action_id`,`position`);--> statement-breakpoint
CREATE TABLE `group_invite` (
	`id` text PRIMARY KEY NOT NULL,
	`group_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`created_by` text NOT NULL,
	`expires_at` integer NOT NULL,
	`max_uses` integer DEFAULT 1 NOT NULL,
	`used_count` integer DEFAULT 0 NOT NULL,
	`revoked_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `group_invite_token_hash_unique` ON `group_invite` (`token_hash`);--> statement-breakpoint
CREATE INDEX `group_invite_group_idx` ON `group_invite` (`group_id`);--> statement-breakpoint
CREATE TABLE `groups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `instance_invite` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`email` text,
	`created_by` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`used_by` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`used_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `instance_invite_token_hash_unique` ON `instance_invite` (`token_hash`);--> statement-breakpoint
CREATE INDEX `instance_invite_expires_idx` ON `instance_invite` (`expires_at`);--> statement-breakpoint
CREATE TABLE `loan` (
	`id` text PRIMARY KEY NOT NULL,
	`tool_id` text NOT NULL,
	`group_id` text NOT NULL,
	`borrower_user_id` text NOT NULL,
	`action_id` text,
	`status` text DEFAULT 'out' NOT NULL,
	`reserved_from` integer,
	`due_at` integer NOT NULL,
	`picked_up_at` integer,
	`returned_at` integer,
	`return_condition` text,
	`return_note` text,
	`extended_count` integer DEFAULT 0 NOT NULL,
	`overdue_reminders_sent` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`tool_id`) REFERENCES `tool`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`borrower_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`action_id`) REFERENCES `action`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `loan_tool_status_idx` ON `loan` (`tool_id`,`status`);--> statement-breakpoint
CREATE INDEX `loan_status_due_idx` ON `loan` (`status`,`due_at`);--> statement-breakpoint
CREATE INDEX `loan_borrower_idx` ON `loan` (`borrower_user_id`);--> statement-breakpoint
CREATE TABLE `login_token` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`email` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`requested_ip` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `login_token_token_hash_unique` ON `login_token` (`token_hash`);--> statement-breakpoint
CREATE INDEX `login_token_email_idx` ON `login_token` (`email`);--> statement-breakpoint
CREATE TABLE `membership` (
	`id` text PRIMARY KEY NOT NULL,
	`group_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`left_at` integer,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `membership_group_user_idx` ON `membership` (`group_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `membership_user_status_idx` ON `membership` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `membership_group_status_idx` ON `membership` (`group_id`,`status`);--> statement-breakpoint
CREATE TABLE `notification` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`group_id` text,
	`type` text NOT NULL,
	`subject_type` text NOT NULL,
	`subject_id` text NOT NULL,
	`channel` text NOT NULL,
	`scheduled_for` integer NOT NULL,
	`sent_at` integer,
	`error` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notification_dedupe_idx` ON `notification` (`user_id`,`type`,`subject_id`,`channel`);--> statement-breakpoint
CREATE INDEX `notification_pending_idx` ON `notification` (`scheduled_for`,`sent_at`);--> statement-breakpoint
CREATE TABLE `push_subscription` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`created_at` integer NOT NULL,
	`last_ok_at` integer,
	`failed_count` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `push_subscription_endpoint_unique` ON `push_subscription` (`endpoint`);--> statement-breakpoint
CREATE INDEX `push_subscription_user_idx` ON `push_subscription` (`user_id`);--> statement-breakpoint
CREATE TABLE `rsvp` (
	`id` text PRIMARY KEY NOT NULL,
	`action_id` text NOT NULL,
	`group_id` text NOT NULL,
	`user_id` text NOT NULL,
	`response` text,
	`responded_at` integer,
	`attended` integer,
	`attendance_at` integer,
	`attendance_by` text,
	FOREIGN KEY (`action_id`) REFERENCES `action`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`attendance_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rsvp_action_user_idx` ON `rsvp` (`action_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `rsvp_user_idx` ON `rsvp` (`user_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`last_used_at` integer,
	`user_agent` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `session_user_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `tool` (
	`id` text PRIMARY KEY NOT NULL,
	`group_id` text NOT NULL,
	`owner_user_id` text,
	`name` text NOT NULL,
	`description` text,
	`storage_note` text,
	`condition` text DEFAULT 'ok' NOT NULL,
	`visibility` text DEFAULT 'group' NOT NULL,
	`is_unavailable` integer DEFAULT false NOT NULL,
	`unavailable_reason` text,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`retired_at` integer,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`owner_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `tool_group_retired_idx` ON `tool` (`group_id`,`retired_at`);--> statement-breakpoint
CREATE INDEX `tool_owner_idx` ON `tool` (`owner_user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`email` text,
	`locale` text DEFAULT 'sl' NOT NULL,
	`notify_email` integer DEFAULT true NOT NULL,
	`notify_push` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`last_seen_at` integer,
	`anonymised_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);