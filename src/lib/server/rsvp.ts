/**
 * Responses to an action (FR-15). Three answers, for the whole action: there is
 * no partial attendance and no waiting list, because the problem in a moba is
 * too few people, not too many.
 */
import { and, eq } from 'drizzle-orm';
import type { Db } from './db';
import { rsvp, user } from './db/schema';
import { inScope, type Scope } from './scope';

export type Response = 'yes' | 'no' | 'maybe';

export type Answer = {
	userId: string;
	displayName: string;
	response: Response | null;
};

export async function answers(db: Db, scope: Scope, actionId: string): Promise<Answer[]> {
	return db
		.select({
			userId: user.id,
			displayName: user.displayName,
			response: rsvp.response
		})
		.from(rsvp)
		.innerJoin(user, eq(user.id, rsvp.userId))
		.where(and(eq(rsvp.actionId, actionId), inScope(rsvp.groupId, scope)))
		.orderBy(user.displayName);
}

export async function respond(
	db: Db,
	scope: Scope,
	actionId: string,
	response: Response
): Promise<void> {
	const [existing] = await db
		.select({ id: rsvp.id })
		.from(rsvp)
		.where(and(eq(rsvp.actionId, actionId), eq(rsvp.userId, scope.userId)))
		.limit(1);

	if (existing) {
		await db
			.update(rsvp)
			.set({ response, respondedAt: new Date() })
			.where(eq(rsvp.id, existing.id));
		return;
	}

	await db.insert(rsvp).values({
		actionId,
		groupId: scope.groupId,
		userId: scope.userId,
		response,
		respondedAt: new Date()
	});
}

export type Tally = { yes: number; maybe: number; no: number };

export function tally(list: Answer[]): Tally {
	return {
		yes: list.filter((a) => a.response === 'yes').length,
		maybe: list.filter((a) => a.response === 'maybe').length,
		no: list.filter((a) => a.response === 'no').length
	};
}

/** What the caller needs to know at a glance, and nothing more. */
export function headcountState(
	tally: Tally,
	min: number | null,
	max: number | null
): 'short' | 'full' | 'ok' {
	if (max !== null && tally.yes >= max) return 'full';
	if (min !== null && tally.yes < min) return 'short';
	return 'ok';
}
