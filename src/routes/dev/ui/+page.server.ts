import { dev } from '$app/environment';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/** The gallery is a development surface — it does not exist in production. */
export const load: PageServerLoad = () => {
	if (!dev) error(404, 'Not found');
	return {};
};
