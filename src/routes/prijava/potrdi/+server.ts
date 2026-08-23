import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE, SESSION_TTL_MS, consumeToken } from '$lib/server/auth';
import { dbFrom } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies, platform, request }) => {
	const token = url.searchParams.get('t');
	const claimed = token
		? await consumeToken(dbFrom(platform), token, request.headers.get('user-agent'))
		: null;

	// unknown, expired and already-used all land here, and say the same thing
	if (!claimed) redirect(303, '/prijava?napaka=povezava');

	cookies.set(SESSION_COOKIE, claimed.sessionId, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: Math.floor(SESSION_TTL_MS / 1000)
	});

	redirect(303, '/');
};
