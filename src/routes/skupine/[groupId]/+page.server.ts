import { fail, redirect } from '@sveltejs/kit';
import { requireUser } from '$lib/server/auth';
import { dbFrom } from '$lib/server/db';
import {
	createInvite,
	group,
	isLastAdmin,
	leave,
	members,
	openInvites,
	promote,
	removeMember,
	revokeInvite
} from '$lib/server/groups';
import { origin } from '$lib/server/env';
import { resolveScope } from '$lib/server/scope';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform, params }) => {
	const user = requireUser(locals);
	const db = dbFrom(platform);
	// resolveScope answers 404 for a group you are not in — see ADR-014
	const scope = await resolveScope(db, user.id, params.groupId);

	return {
		group: await group(db, scope),
		members: await members(db, scope),
		invites: scope.role === 'admin' ? await openInvites(db, scope) : [],
		role: scope.role,
		me: user.id
	};
};

export const actions: Actions = {
	invite: async ({ locals, platform, params, request }) => {
		const user = requireUser(locals);
		const db = dbFrom(platform);
		const scope = await resolveScope(db, user.id, params.groupId);
		const token = await createInvite(db, scope);

		return {
			link: `${origin(platform?.env, new URL(request.url).origin)}/vabilo/${token}`
		};
	},

	revoke: async ({ locals, platform, params, request }) => {
		const user = requireUser(locals);
		const db = dbFrom(platform);
		const scope = await resolveScope(db, user.id, params.groupId);
		const form = await request.formData();
		await revokeInvite(db, scope, String(form.get('id') ?? ''));
		return { revoked: true };
	},

	remove: async ({ locals, platform, params, request }) => {
		const user = requireUser(locals);
		const db = dbFrom(platform);
		const scope = await resolveScope(db, user.id, params.groupId);
		const form = await request.formData();
		const target = String(form.get('userId') ?? '');

		if (await isLastAdmin(db, scope.groupId, target)) {
			return fail(409, { lastAdmin: true });
		}

		await removeMember(db, scope, target);
		return { removed: true };
	},

	promote: async ({ locals, platform, params, request }) => {
		const user = requireUser(locals);
		const db = dbFrom(platform);
		const scope = await resolveScope(db, user.id, params.groupId);
		const form = await request.formData();
		await promote(db, scope, String(form.get('userId') ?? ''));
		return { promoted: true };
	},

	leave: async ({ locals, platform, params }) => {
		const user = requireUser(locals);
		const db = dbFrom(platform);
		const scope = await resolveScope(db, user.id, params.groupId);

		// the group must keep an admin; handing the role over is the way out
		if (await isLastAdmin(db, scope.groupId, user.id)) {
			return fail(409, { lastAdmin: true });
		}

		await leave(db, scope.groupId, user.id);
		redirect(303, '/skupine');
	}
};
