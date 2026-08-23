import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE, destroySession } from '$lib/server/auth';
import { dbFrom } from '$lib/server/db';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => ({
	user: locals.user ? { displayName: locals.user.displayName } : null
});

export const actions: Actions = {
	odjava: async ({ cookies, locals, platform }) => {
		if (locals.sessionId) await destroySession(dbFrom(platform), locals.sessionId);
		cookies.delete(SESSION_COOKIE, { path: '/' });
		redirect(303, '/');
	}
};
