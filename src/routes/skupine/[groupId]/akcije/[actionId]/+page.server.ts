import { fail, redirect } from '@sveltejs/kit';
import {
	addEquipment,
	addTask,
	canEdit,
	claimEquipment,
	duplicate,
	equipment,
	get,
	publish,
	removeEquipment,
	removeTask,
	tasks,
	toggleTask
} from '$lib/server/actions';
import { requireUser } from '$lib/server/auth';
import { dbFrom } from '$lib/server/db';
import { origin } from '$lib/server/env';
import { group, members } from '$lib/server/groups';
import { notifyActionPublished } from '$lib/server/notify';
import { answers, respond, tally, type Response } from '$lib/server/rsvp';
import { resolveScope } from '$lib/server/scope';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform, params }) => {
	const user = requireUser(locals);
	const db = dbFrom(platform);
	const scope = await resolveScope(db, user.id, params.groupId);
	const row = await get(db, scope, params.actionId);
	const people = await members(db, scope);
	const names = new Map(people.map((person) => [person.userId, person.displayName]));

	const responses = await answers(db, scope, row.id);

	return {
		action: row,
		group: await group(db, scope),
		answers: responses,
		tally: tally(responses),
		myResponse: responses.find((answer) => answer.userId === user.id)?.response ?? null,
		tasks: (await tasks(db, row.id)).map((task) => ({
			...task,
			doneByName: task.doneBy ? (names.get(task.doneBy) ?? null) : null
		})),
		equipment: (await equipment(db, row.id)).map((item) => ({
			...item,
			broughtByName: item.broughtBy ? (names.get(item.broughtBy) ?? null) : null
		})),
		canEdit: canEdit(row, scope),
		me: user.id
	};
};

/** Every action re-resolves the scope: the session is not a capability. */
async function scoped(event: Parameters<Actions[string]>[0]) {
	const user = requireUser(event.locals);
	const db = dbFrom(event.platform);
	return { db, scope: await resolveScope(db, user.id, event.params.groupId as string) };
}

export const actions: Actions = {
	publish: async (event) => {
		const { db, scope } = await scoped(event);
		const result = await publish(db, scope, event.params.actionId as string);
		if (result === 'needs-task') return fail(400, { needsTask: true });

		if (result === 'published') {
			const row = await get(db, scope, event.params.actionId as string);
			const where = await group(db, scope);
			// publication is the only thing that notifies anyone (FR-10)
			await notifyActionPublished(db, event.platform?.env, {
				action: row,
				origin: origin(event.platform?.env, new URL(event.request.url).origin),
				groupName: where?.name ?? '',
				calledBy: scope.userId
			});
		}

		return { published: result === 'published' };
	},

	respond: async (event) => {
		const { db, scope } = await scoped(event);
		const form = await event.request.formData();
		const response = String(form.get('response') ?? '') as Response;
		if (!['yes', 'no', 'maybe'].includes(response)) return fail(400, { badResponse: true });

		await respond(db, scope, event.params.actionId as string, response);
		return { responded: true };
	},

	addTask: async (event) => {
		const { db, scope } = await scoped(event);
		const form = await event.request.formData();
		const title = String(form.get('title') ?? '').trim();
		if (title.length < 2) return fail(400, { taskInvalid: true });
		await addTask(db, scope, event.params.actionId as string, title);
		return { taskAdded: true };
	},

	toggleTask: async (event) => {
		const { db, scope } = await scoped(event);
		const form = await event.request.formData();
		await toggleTask(db, scope, String(form.get('id') ?? ''), form.get('done') === 'true');
		return { toggled: true };
	},

	removeTask: async (event) => {
		const { db, scope } = await scoped(event);
		const form = await event.request.formData();
		await removeTask(db, scope, String(form.get('id') ?? ''));
		return { taskRemoved: true };
	},

	addEquipment: async (event) => {
		const { db, scope } = await scoped(event);
		const form = await event.request.formData();
		const label = String(form.get('label') ?? '').trim();
		if (label.length < 2) return fail(400, { equipmentInvalid: true });
		await addEquipment(db, scope, event.params.actionId as string, label);
		return { equipmentAdded: true };
	},

	claimEquipment: async (event) => {
		const { db, scope } = await scoped(event);
		const form = await event.request.formData();
		await claimEquipment(db, scope, String(form.get('id') ?? ''), form.get('claim') === 'true');
		return { claimed: true };
	},

	removeEquipment: async (event) => {
		const { db, scope } = await scoped(event);
		const form = await event.request.formData();
		await removeEquipment(db, scope, String(form.get('id') ?? ''));
		return { equipmentRemoved: true };
	},

	duplicate: async (event) => {
		const { db, scope } = await scoped(event);
		const id = await duplicate(db, scope, event.params.actionId as string);
		redirect(303, `/skupine/${event.params.groupId}/akcije/${id}/uredi`);
	}
};
