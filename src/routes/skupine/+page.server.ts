import { fail, redirect } from '@sveltejs/kit';
import { requireUser } from '$lib/server/auth';
import { dbFrom } from '$lib/server/db';
import { createGroup, myGroups } from '$lib/server/groups';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
	const user = requireUser(locals);
	return { groups: await myGroups(dbFrom(platform), user.id) };
};

export const actions: Actions = {
	create: async ({ locals, platform, request }) => {
		const user = requireUser(locals);
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();

		if (name.length < 2) return fail(400, { name, invalid: true });

		const id = await createGroup(dbFrom(platform), {
			userId: user.id,
			name,
			description: String(form.get('description') ?? '')
		});

		redirect(303, `/skupine/${id}`);
	}
};
