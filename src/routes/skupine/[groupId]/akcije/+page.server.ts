import { requireUser } from '$lib/server/auth';
import { upcoming } from '$lib/server/actions';
import { dbFrom } from '$lib/server/db';
import { group } from '$lib/server/groups';
import { resolveScope } from '$lib/server/scope';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform, params }) => {
	const user = requireUser(locals);
	const db = dbFrom(platform);
	const scope = await resolveScope(db, user.id, params.groupId);

	return {
		group: await group(db, scope),
		actions: await upcoming(db, scope),
		me: user.id
	};
};
