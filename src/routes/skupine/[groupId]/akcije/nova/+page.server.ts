import { fail, redirect } from '@sveltejs/kit';
import { createDraft, validate, type ActionInput } from '$lib/server/actions';
import { requireUser } from '$lib/server/auth';
import { dbFrom } from '$lib/server/db';
import { resolveScope } from '$lib/server/scope';
import { readActionForm } from '$lib/server/action-form';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform, params }) => {
	const user = requireUser(locals);
	await resolveScope(dbFrom(platform), user.id, params.groupId);
	return {};
};

export const actions: Actions = {
	default: async ({ locals, platform, params, request }) => {
		const user = requireUser(locals);
		const db = dbFrom(platform);
		const scope = await resolveScope(db, user.id, params.groupId);

		const form = await request.formData();
		const input = readActionForm(form);
		const problems = validate(input);
		if (problems.length > 0) return fail(400, { problems, values: Object.fromEntries(form) });

		const id = await createDraft(db, scope, input as ActionInput);
		redirect(303, `/skupine/${params.groupId}/akcije/${id}`);
	}
};
