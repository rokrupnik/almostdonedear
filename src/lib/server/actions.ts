/**
 * Actions — the work days themselves (FR-10 to FR-14, FR-19).
 *
 * Two rules are enforced here rather than in a form, because a form is not a
 * boundary: an action cannot be published without at least one task (FR-12),
 * and a draft is visible only to the person who called it and to the group's
 * admins.
 */
import { and, asc, eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { Db } from './db';
import { action, actionEquipment, actionTask } from './db/schema';
import { inScope, type Scope } from './scope';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type ActionStatus = 'draft' | 'published' | 'completed' | 'cancelled';

export type ActionInput = {
	title: string;
	description?: string | null;
	startsAt: Date;
	endsAt: Date;
	locationName: string;
	locationAddress?: string | null;
	minParticipants?: number | null;
	minDecisionAt?: Date | null;
	maxParticipants?: number | null;
};

export type ValidationError =
	| 'title'
	| 'location'
	| 'starts-at'
	| 'ends-before-start'
	| 'deadline-after-start'
	| 'max-below-min';

/** Pure, so it can be unit tested without a database — and it is. */
export function validate(input: Partial<ActionInput>): ValidationError[] {
	const problems: ValidationError[] = [];

	if (!input.title || input.title.trim().length < 3) problems.push('title');
	if (!input.locationName || input.locationName.trim().length < 2) problems.push('location');
	if (!input.startsAt || Number.isNaN(input.startsAt.getTime())) problems.push('starts-at');

	if (input.startsAt && input.endsAt && input.endsAt.getTime() < input.startsAt.getTime()) {
		problems.push('ends-before-start');
	}
	if (
		input.startsAt &&
		input.minDecisionAt &&
		input.minDecisionAt.getTime() > input.startsAt.getTime()
	) {
		problems.push('deadline-after-start');
	}
	if (
		input.minParticipants &&
		input.maxParticipants &&
		input.maxParticipants < input.minParticipants
	) {
		problems.push('max-below-min');
	}

	return problems;
}

export function canEdit(row: { createdBy: string }, scope: Scope): boolean {
	return row.createdBy === scope.userId || scope.role === 'admin';
}

/** A draft belongs to its caller and to the admins, and to nobody else (FR-10). */
export function canSee(row: { createdBy: string; status: string }, scope: Scope): boolean {
	return row.status !== 'draft' || canEdit(row, scope);
}

export async function list(db: Db, scope: Scope) {
	const rows = await db
		.select()
		.from(action)
		.where(inScope(action.groupId, scope))
		.orderBy(asc(action.startsAt));

	return rows.filter((row) => canSee(row, scope));
}

export async function upcoming(db: Db, scope: Scope) {
	const now = new Date();
	return (await list(db, scope)).filter((row) => row.status !== 'cancelled' && row.endsAt >= now);
}

export async function get(db: Db, scope: Scope, id: string) {
	const [row] = await db
		.select()
		.from(action)
		.where(and(eq(action.id, id), inScope(action.groupId, scope)))
		.limit(1);

	// 404 rather than 403, for the same reason group scope answers 404
	if (!row || !canSee(row, scope)) error(404, 'Not found');
	return row;
}

export async function tasks(db: Db, actionId: string) {
	return db
		.select()
		.from(actionTask)
		.where(eq(actionTask.actionId, actionId))
		.orderBy(asc(actionTask.position));
}

export async function equipment(db: Db, actionId: string) {
	return db
		.select()
		.from(actionEquipment)
		.where(eq(actionEquipment.actionId, actionId))
		.orderBy(asc(actionEquipment.label));
}

export async function createDraft(db: Db, scope: Scope, input: ActionInput): Promise<string> {
	const [row] = await db
		.insert(action)
		.values({
			groupId: scope.groupId,
			createdBy: scope.userId,
			title: input.title.trim(),
			description: input.description?.trim() || null,
			status: 'draft',
			startsAt: input.startsAt,
			endsAt: input.endsAt,
			locationName: input.locationName.trim(),
			locationAddress: input.locationAddress?.trim() || null,
			minParticipants: input.minParticipants ?? null,
			minDecisionAt: input.minDecisionAt ?? null,
			maxParticipants: input.maxParticipants ?? null
		})
		.returning({ id: action.id });

	return row.id;
}

export async function update(db: Db, scope: Scope, id: string, input: ActionInput): Promise<void> {
	const row = await get(db, scope, id);
	if (!canEdit(row, scope)) error(403, 'Not yours');

	await db
		.update(action)
		.set({
			title: input.title.trim(),
			description: input.description?.trim() || null,
			startsAt: input.startsAt,
			endsAt: input.endsAt,
			locationName: input.locationName.trim(),
			locationAddress: input.locationAddress?.trim() || null,
			minParticipants: input.minParticipants ?? null,
			minDecisionAt: input.minDecisionAt ?? null,
			maxParticipants: input.maxParticipants ?? null
		})
		.where(and(eq(action.id, id), inScope(action.groupId, scope)));
}

export type PublishResult = 'published' | 'needs-task' | 'already';

/**
 * FR-12 lives here and not in the form: publishing without a task is refused by
 * the only thing that counts, so that nobody arrives at a work day wondering
 * what they signed up for.
 */
export async function publish(db: Db, scope: Scope, id: string): Promise<PublishResult> {
	const row = await get(db, scope, id);
	if (!canEdit(row, scope)) error(403, 'Not yours');
	if (row.status !== 'draft') return 'already';

	const list = await tasks(db, id);
	if (list.length === 0) return 'needs-task';

	await db
		.update(action)
		.set({ status: 'published', publishedAt: new Date() })
		.where(and(eq(action.id, id), inScope(action.groupId, scope)));

	return 'published';
}

/** Duplication is what we have instead of recurrence (ADR-013). */
export async function duplicate(db: Db, scope: Scope, id: string): Promise<string> {
	const row = await get(db, scope, id);
	const source = await tasks(db, id);
	const gear = await equipment(db, id);

	const [copy] = await db
		.insert(action)
		.values({
			groupId: scope.groupId,
			createdBy: scope.userId,
			title: row.title,
			description: row.description,
			status: 'draft',
			// a copy is almost always the next occurrence, so the dates move a week
			// forward rather than arriving already in the past
			startsAt: new Date(row.startsAt.getTime() + WEEK_MS),
			endsAt: new Date(row.endsAt.getTime() + WEEK_MS),
			locationName: row.locationName,
			locationAddress: row.locationAddress,
			minParticipants: row.minParticipants,
			maxParticipants: row.maxParticipants,
			duplicatedFrom: row.id
		})
		.returning({ id: action.id });

	for (const task of source) {
		await db.insert(actionTask).values({
			actionId: copy.id,
			groupId: scope.groupId,
			title: task.title,
			position: task.position
		});
	}
	for (const item of gear) {
		await db.insert(actionEquipment).values({
			actionId: copy.id,
			groupId: scope.groupId,
			label: item.label,
			quantity: item.quantity
		});
	}

	return copy.id;
}

export async function addTask(db: Db, scope: Scope, actionId: string, title: string) {
	const row = await get(db, scope, actionId);
	if (!canEdit(row, scope)) error(403, 'Not yours');

	const existing = await tasks(db, actionId);
	await db.insert(actionTask).values({
		actionId,
		groupId: scope.groupId,
		title: title.trim(),
		position: existing.length
	});
}

/** A toggle, because it is also one of the two operations that work offline. */
export async function toggleTask(db: Db, scope: Scope, taskId: string, done: boolean) {
	await db
		.update(actionTask)
		.set({
			doneAt: done ? new Date() : null,
			doneBy: done ? scope.userId : null
		})
		.where(and(eq(actionTask.id, taskId), inScope(actionTask.groupId, scope)));
}

export async function removeTask(db: Db, scope: Scope, taskId: string) {
	await db
		.delete(actionTask)
		.where(and(eq(actionTask.id, taskId), inScope(actionTask.groupId, scope)));
}

export async function addEquipment(db: Db, scope: Scope, actionId: string, label: string) {
	const row = await get(db, scope, actionId);
	if (!canEdit(row, scope)) error(403, 'Not yours');

	await db.insert(actionEquipment).values({
		actionId,
		groupId: scope.groupId,
		label: label.trim()
	});
}

/** "I'll bring it" — and clicking it again lets go of it. */
export async function claimEquipment(db: Db, scope: Scope, itemId: string, claim: boolean) {
	await db
		.update(actionEquipment)
		.set({ broughtBy: claim ? scope.userId : null })
		.where(and(eq(actionEquipment.id, itemId), inScope(actionEquipment.groupId, scope)));
}

export async function removeEquipment(db: Db, scope: Scope, itemId: string) {
	await db
		.delete(actionEquipment)
		.where(and(eq(actionEquipment.id, itemId), inScope(actionEquipment.groupId, scope)));
}
