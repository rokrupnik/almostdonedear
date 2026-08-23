/**
 * Sending, and sending exactly once.
 *
 * Every intended delivery is a row in `notification`, and that table carries a
 * unique index on (user, type, subject, channel). Inserting first and sending
 * second means a re-publish, a retry or a second Cron run cannot produce a
 * second email — the database refuses, rather than the code remembering to.
 */
import { and, eq } from 'drizzle-orm';
import type { Db } from './db';
import { membership, notification, user, type Action } from './db/schema';
import { mailer, type Mail } from './email';
import { formatWhen } from '$lib/format';

type Recipients = { id: string; email: string | null }[];

async function mailableMembers(db: Db, groupId: string, except: string): Promise<Recipients> {
	const rows = await db
		.select({ id: user.id, email: user.email, notifyEmail: user.notifyEmail })
		.from(membership)
		.innerJoin(user, eq(user.id, membership.userId))
		.where(and(eq(membership.groupId, groupId), eq(membership.status, 'active')));

	return rows.filter((row) => row.id !== except && row.notifyEmail && row.email);
}

export async function notifyActionPublished(
	db: Db,
	env: Env | undefined,
	input: { action: Action; origin: string; groupName: string; calledBy: string }
): Promise<number> {
	const recipients = await mailableMembers(db, input.action.groupId, input.calledBy);
	const link = `${input.origin}/skupine/${input.action.groupId}/akcije/${input.action.id}`;
	const post = mailer(env);
	let sent = 0;

	for (const person of recipients) {
		// the unique index is the guard; an already-known delivery inserts nothing
		const claimed = await db
			.insert(notification)
			.values({
				userId: person.id,
				groupId: input.action.groupId,
				type: 'action_published',
				subjectType: 'action',
				subjectId: input.action.id,
				channel: 'email',
				scheduledFor: new Date()
			})
			.onConflictDoNothing()
			.returning({ id: notification.id });

		if (claimed.length === 0) continue;

		try {
			await post.send({ to: person.email as string, ...actionMail(input, link) });
			await db
				.update(notification)
				.set({ sentAt: new Date() })
				.where(eq(notification.id, claimed[0].id));
			sent++;
		} catch (cause) {
			// a failed send stays recorded, so it is visible rather than silent
			await db
				.update(notification)
				.set({ error: String(cause).slice(0, 500) })
				.where(eq(notification.id, claimed[0].id));
		}
	}

	return sent;
}

function actionMail(input: { action: Action; groupName: string }, link: string): Omit<Mail, 'to'> {
	const when = formatWhen(input.action.startsAt, input.action.endsAt);
	return {
		subject: `${input.groupName}: ${input.action.title}`,
		text: [
			`Sklicana je akcija: ${input.action.title}`,
			'',
			`Kdaj: ${when}`,
			`Kje: ${input.action.locationName}`,
			'',
			'Povej, ali prideš:',
			link
		].join('\n'),
		html: [
			`<p>Sklicana je akcija: <strong>${input.action.title}</strong></p>`,
			`<p>Kdaj: ${when}<br>Kje: ${input.action.locationName}</p>`,
			`<p><a href="${link}">Povej, ali prideš</a></p>`
		].join('')
	};
}
