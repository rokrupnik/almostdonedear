import { fail, redirect } from '@sveltejs/kit';
import { canEdit, get, update, validate, type ActionInput } from '$lib/server/actions';
import { requireUser } from '$lib/server/auth';
import { dbFrom } from '$lib/server/db';
import { resolveScope } from '$lib/server/scope';
import { toLocalInput } from '$lib/format';
import { readActionForm } from '$lib/server/action-form';
import { error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform, params }) => {
	const user = requireUser(locals);
	const db = dbFrom(platform);
	const scope = await resolveScope(db, user.id, params.groupId);
	const row = await get(db, scope, params.actionId);
	if (!canEdit(row, scope)) error(403, 'Not yours');

	return {
		values: {
			title: row.title,
			description: row.description ?? '',
			startsAt: toLocalInput(row.startsAt),
			endsAt: toLocalInput(row.endsAt),
			locationName: row.locationName,
			locationAddress: row.locationAddress ?? '',
			minParticipants: row.minParticipants ?? '',
			minDecisionAt: toLocalInput(row.minDecisionAt),
			maxParticipants: row.maxParticipants ?? ''
		},
		title: row.title
	};
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

		await update(db, scope, params.actionId, input as ActionInput);
		redirect(303, `/skupine/${params.groupId}/akcije/${params.actionId}`);
	}
};
