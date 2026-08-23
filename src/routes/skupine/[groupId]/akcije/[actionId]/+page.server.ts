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
import { members } from '$lib/server/groups';
import { resolveScope } from '$lib/server/scope';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform, params }) => {
	const user = requireUser(locals);
	const db = dbFrom(platform);
	const scope = await resolveScope(db, user.id, params.groupId);
	const row = await get(db, scope, params.actionId);
	const people = await members(db, scope);
	const names = new Map(people.map((person) => [person.userId, person.displayName]));

	return {
		action: row,
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
		return { published: result === 'published' };
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
