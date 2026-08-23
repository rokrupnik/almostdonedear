import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { getTextDirection } from '$lib/paraglide/runtime';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { SESSION_COOKIE, validateSession } from '$lib/server/auth';
import { dbFrom } from '$lib/server/db';

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) =>
				html
					.replace('%paraglide.lang%', locale)
					.replace('%paraglide.dir%', getTextDirection(locale))
		});
	});

/**
 * Resolves the session once per request. A cookie that names a session which no
 * longer exists is cleared here rather than left to rot in the browser.
 */
const handleSession: Handle = async ({ event, resolve }) => {
	event.locals.user = null;
	event.locals.sessionId = null;

	const id = event.cookies.get(SESSION_COOKIE);
	if (id && event.platform) {
		const user = await validateSession(dbFrom(event.platform), id);
		if (user) {
			event.locals.user = user;
			event.locals.sessionId = id;
		} else {
			event.cookies.delete(SESSION_COOKIE, { path: '/' });
		}
	}

	return resolve(event);
};

export const handle: Handle = sequence(handleSession, handleParaglide);
