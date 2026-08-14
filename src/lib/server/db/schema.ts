/**
 * Database schema — see docs/data-model.md for the reasoning behind it.
 *
 * Conventions:
 *  - ids are ULIDs (see $lib/server/ids), text, sortable by creation time
 *  - timestamps are integers (epoch ms) exposed as Date via timestamp_ms
 *  - booleans are integers exposed as boolean
 *  - every tenant-scoped row carries group_id directly, so the scope filter
 *    of ADR-014 is a single predicate
 */
import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { ulid } from '../ids';

const id = () =>
	text('id')
		.primaryKey()
		.$defaultFn(() => ulid());

const createdAt = () =>
	integer('created_at', { mode: 'timestamp_ms' })
		.notNull()
		.$defaultFn(() => new Date());

/* -------------------------------------------------------------------------- */
/* People and access                                                          */
/* -------------------------------------------------------------------------- */

export const user = sqliteTable('user', {
	id: id(),
	displayName: text('display_name').notNull(),
	/** null once the account has been anonymised (ADR-004) */
	email: text('email').unique(),
	locale: text('locale').notNull().default('sl'),
	notifyEmail: integer('notify_email', { mode: 'boolean' }).notNull().default(true),
	notifyPush: integer('notify_push', { mode: 'boolean' }).notNull().default(true),
	createdAt: createdAt(),
	lastSeenAt: integer('last_seen_at', { mode: 'timestamp_ms' }),
	anonymisedAt: integer('anonymised_at', { mode: 'timestamp_ms' })
});

/** Gets a person into the system before they belong to any group (ADR-002). */
export const instanceInvite = sqliteTable(
	'instance_invite',
	{
		id: id(),
		tokenHash: text('token_hash').notNull().unique(),
		email: text('email'),
		createdBy: text('created_by')
			.notNull()
			.references(() => user.id),
		expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
		usedAt: integer('used_at', { mode: 'timestamp_ms' }),
		usedBy: text('used_by').references(() => user.id),
		createdAt: createdAt()
	},
	(t) => [index('instance_invite_expires_idx').on(t.expiresAt)]
);

export const session = sqliteTable(
	'session',
	{
		/** opaque, generated with crypto.getRandomValues — never a ULID */
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id),
		createdAt: createdAt(),
		expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
		lastUsedAt: integer('last_used_at', { mode: 'timestamp_ms' }),
		userAgent: text('user_agent')
	},
	(t) => [index('session_user_idx').on(t.userId)]
);

/** Single-use sign-in links (ADR-010). Only the hash is stored. */
export const loginToken = sqliteTable(
	'login_token',
	{
		id: id(),
		tokenHash: text('token_hash').notNull().unique(),
		email: text('email').notNull(),
		expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
		usedAt: integer('used_at', { mode: 'timestamp_ms' }),
		requestedIp: text('requested_ip'),
		createdAt: createdAt()
	},
	(t) => [index('login_token_email_idx').on(t.email)]
);

/* -------------------------------------------------------------------------- */
/* Groups                                                                     */
/* -------------------------------------------------------------------------- */

export const groups = sqliteTable('groups', {
	id: id(),
	name: text('name').notNull(),
	description: text('description'),
	createdBy: text('created_by')
		.notNull()
		.references(() => user.id),
	createdAt: createdAt()
});

export const membership = sqliteTable(
	'membership',
	{
		id: id(),
		groupId: text('group_id')
			.notNull()
			.references(() => groups.id),
		userId: text('user_id')
			.notNull()
			.references(() => user.id),
		role: text('role', { enum: ['admin', 'member'] })
			.notNull()
			.default('member'),
		status: text('status', { enum: ['active', 'left'] })
			.notNull()
			.default('active'),
		joinedAt: createdAt(),
		leftAt: integer('left_at', { mode: 'timestamp_ms' })
	},
	(t) => [
		uniqueIndex('membership_group_user_idx').on(t.groupId, t.userId),
		index('membership_user_status_idx').on(t.userId, t.status),
		index('membership_group_status_idx').on(t.groupId, t.status)
	]
);

export const groupInvite = sqliteTable(
	'group_invite',
	{
		id: id(),
		groupId: text('group_id')
			.notNull()
			.references(() => groups.id),
		tokenHash: text('token_hash').notNull().unique(),
		createdBy: text('created_by')
			.notNull()
			.references(() => user.id),
		expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
		maxUses: integer('max_uses').notNull().default(1),
		usedCount: integer('used_count').notNull().default(0),
		revokedAt: integer('revoked_at', { mode: 'timestamp_ms' }),
		createdAt: createdAt()
	},
	(t) => [index('group_invite_group_idx').on(t.groupId)]
);

/* -------------------------------------------------------------------------- */
/* Actions (work days)                                                        */
/* -------------------------------------------------------------------------- */

export const action = sqliteTable(
	'action',
	{
		id: id(),
		groupId: text('group_id')
			.notNull()
			.references(() => groups.id),
		createdBy: text('created_by')
			.notNull()
			.references(() => user.id),
		title: text('title').notNull(),
		description: text('description'),
		status: text('status', { enum: ['draft', 'published', 'completed', 'cancelled'] })
			.notNull()
			.default('draft'),
		startsAt: integer('starts_at', { mode: 'timestamp_ms' }).notNull(),
		endsAt: integer('ends_at', { mode: 'timestamp_ms' }).notNull(),
		locationName: text('location_name').notNull(),
		locationAddress: text('location_address'),
		lat: real('lat'),
		lon: real('lon'),
		/** optional floor with a decision deadline (FR-16) */
		minParticipants: integer('min_participants'),
		minDecisionAt: integer('min_decision_at', { mode: 'timestamp_ms' }),
		/** optional ceiling; locks "yes" when reached (FR-17) */
		maxParticipants: integer('max_participants'),
		publishedAt: integer('published_at', { mode: 'timestamp_ms' }),
		completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
		cancelledAt: integer('cancelled_at', { mode: 'timestamp_ms' }),
		cancelReason: text('cancel_reason'),
		duplicatedFrom: text('duplicated_from'),
		createdAt: createdAt()
	},
	(t) => [
		index('action_group_status_start_idx').on(t.groupId, t.status, t.startsAt),
		index('action_start_idx').on(t.startsAt)
	]
);

export const actionTask = sqliteTable(
	'action_task',
	{
		id: id(),
		actionId: text('action_id')
			.notNull()
			.references(() => action.id),
		groupId: text('group_id')
			.notNull()
			.references(() => groups.id),
		title: text('title').notNull(),
		position: integer('position').notNull().default(0),
		assigneeUserId: text('assignee_user_id').references(() => user.id),
		doneAt: integer('done_at', { mode: 'timestamp_ms' }),
		doneBy: text('done_by').references(() => user.id)
	},
	(t) => [index('action_task_action_idx').on(t.actionId, t.position)]
);

export const actionEquipment = sqliteTable(
	'action_equipment',
	{
		id: id(),
		actionId: text('action_id')
			.notNull()
			.references(() => action.id),
		groupId: text('group_id')
			.notNull()
			.references(() => groups.id),
		label: text('label').notNull(),
		quantity: integer('quantity').notNull().default(1),
		/** optional link into the catalogue; must belong to the same group */
		toolId: text('tool_id'),
		broughtBy: text('brought_by').references(() => user.id),
		loanId: text('loan_id')
	},
	(t) => [index('action_equipment_action_idx').on(t.actionId)]
);

/** One row per person per action; also carries attendance (FR-20). */
export const rsvp = sqliteTable(
	'rsvp',
	{
		id: id(),
		actionId: text('action_id')
			.notNull()
			.references(() => action.id),
		groupId: text('group_id')
			.notNull()
			.references(() => groups.id),
		userId: text('user_id')
			.notNull()
			.references(() => user.id),
		/** null = never responded but turned up */
		response: text('response', { enum: ['yes', 'no', 'maybe'] }),
		respondedAt: integer('responded_at', { mode: 'timestamp_ms' }),
		/** null = attendance not recorded */
		attended: integer('attended', { mode: 'boolean' }),
		attendanceAt: integer('attendance_at', { mode: 'timestamp_ms' }),
		attendanceBy: text('attendance_by').references(() => user.id)
	},
	(t) => [
		uniqueIndex('rsvp_action_user_idx').on(t.actionId, t.userId),
		index('rsvp_user_idx').on(t.userId)
	]
);

/* -------------------------------------------------------------------------- */
/* Tools and loans                                                            */
/* -------------------------------------------------------------------------- */

export const tool = sqliteTable(
	'tool',
	{
		id: id(),
		groupId: text('group_id')
			.notNull()
			.references(() => groups.id),
		/** null = owned by the group itself (FR-22) */
		ownerUserId: text('owner_user_id').references(() => user.id),
		name: text('name').notNull(),
		description: text('description'),
		/** address-like free text; never leaves the group (ADR-016) */
		storageNote: text('storage_note'),
		condition: text('condition', { enum: ['ok', 'damaged', 'in_repair', 'lost'] })
			.notNull()
			.default('ok'),
		/** `network` ships in the model but resolves to nothing in the MVP (ADR-015) */
		visibility: text('visibility', { enum: ['private', 'group', 'network'] })
			.notNull()
			.default('group'),
		isUnavailable: integer('is_unavailable', { mode: 'boolean' }).notNull().default(false),
		unavailableReason: text('unavailable_reason'),
		createdBy: text('created_by')
			.notNull()
			.references(() => user.id),
		createdAt: createdAt(),
		retiredAt: integer('retired_at', { mode: 'timestamp_ms' })
	},
	(t) => [
		index('tool_group_retired_idx').on(t.groupId, t.retiredAt),
		index('tool_owner_idx').on(t.ownerUserId)
	]
);

export const loan = sqliteTable(
	'loan',
	{
		id: id(),
		toolId: text('tool_id')
			.notNull()
			.references(() => tool.id),
		groupId: text('group_id')
			.notNull()
			.references(() => groups.id),
		borrowerUserId: text('borrower_user_id')
			.notNull()
			.references(() => user.id),
		/** set when the loan was created by claiming equipment on an action */
		actionId: text('action_id').references(() => action.id),
		status: text('status', { enum: ['reserved', 'out', 'returned', 'cancelled'] })
			.notNull()
			.default('out'),
		reservedFrom: integer('reserved_from', { mode: 'timestamp_ms' }),
		dueAt: integer('due_at', { mode: 'timestamp_ms' }).notNull(),
		pickedUpAt: integer('picked_up_at', { mode: 'timestamp_ms' }),
		returnedAt: integer('returned_at', { mode: 'timestamp_ms' }),
		returnCondition: text('return_condition', { enum: ['ok', 'damaged', 'in_repair', 'lost'] }),
		returnNote: text('return_note'),
		extendedCount: integer('extended_count').notNull().default(0),
		overdueRemindersSent: integer('overdue_reminders_sent').notNull().default(0),
		createdAt: createdAt()
	},
	(t) => [
		index('loan_tool_status_idx').on(t.toolId, t.status),
		index('loan_status_due_idx').on(t.status, t.dueAt),
		index('loan_borrower_idx').on(t.borrowerUserId)
	]
);

/* -------------------------------------------------------------------------- */
/* Notifications                                                              */
/* -------------------------------------------------------------------------- */

export const pushSubscription = sqliteTable(
	'push_subscription',
	{
		id: id(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id),
		endpoint: text('endpoint').notNull().unique(),
		p256dh: text('p256dh').notNull(),
		auth: text('auth').notNull(),
		createdAt: createdAt(),
		lastOkAt: integer('last_ok_at', { mode: 'timestamp_ms' }),
		failedCount: integer('failed_count').notNull().default(0)
	},
	(t) => [index('push_subscription_user_idx').on(t.userId)]
);

export const NOTIFICATION_TYPES = [
	'action_published',
	'action_changed',
	'action_cancelled',
	'min_deadline',
	'reminder_48h',
	'reminder_3h',
	'loan_created',
	'loan_returned',
	'loan_due',
	'loan_overdue',
	'loan_nudge'
] as const;

/**
 * One row per intended delivery. The unique index is what makes a re-run of a
 * Cron Trigger harmless — see docs/data-model.md.
 */
export const notification = sqliteTable(
	'notification',
	{
		id: id(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id),
		groupId: text('group_id').references(() => groups.id),
		type: text('type', { enum: NOTIFICATION_TYPES }).notNull(),
		subjectType: text('subject_type', { enum: ['action', 'loan'] }).notNull(),
		subjectId: text('subject_id').notNull(),
		channel: text('channel', { enum: ['email', 'push'] }).notNull(),
		scheduledFor: integer('scheduled_for', { mode: 'timestamp_ms' }).notNull(),
		sentAt: integer('sent_at', { mode: 'timestamp_ms' }),
		error: text('error'),
		createdAt: createdAt()
	},
	(t) => [
		uniqueIndex('notification_dedupe_idx').on(t.userId, t.type, t.subjectId, t.channel),
		index('notification_pending_idx').on(t.scheduledFor, t.sentAt)
	]
);

export type User = typeof user.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type Membership = typeof membership.$inferSelect;
export type Action = typeof action.$inferSelect;
export type ActionTask = typeof actionTask.$inferSelect;
export type Rsvp = typeof rsvp.$inferSelect;
export type Tool = typeof tool.$inferSelect;
export type Loan = typeof loan.$inferSelect;
export type Notification = typeof notification.$inferSelect;
