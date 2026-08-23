import { fail, redirect } from '@sveltejs/kit';
import { requestSignIn } from '$lib/server/auth';
import { dbFrom } from '$lib/server/db';
import { mailer, signInMail } from '$lib/server/email';
import { flag, origin } from '$lib/server/env';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) redirect(303, '/');
	return {};
};

export const actions: Actions = {
	default: async ({ request, platform, getClientAddress }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '');

		// deliberately shallow: the mail server is the real validator
		if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
			return fail(400, { email, invalid: true });
		}

		const result = await requestSignIn(dbFrom(platform), {
			email,
			ip: getClientAddress()
		});

		if (result.status === 'rate-limited') return fail(429, { email, rateLimited: true });

		if (result.status === 'sent' && result.user.email) {
			const link = `${origin(platform?.env, new URL(request.url).origin)}/prijava/potrdi?t=${result.token}`;
			await mailer(platform?.env).send({ to: result.user.email, ...signInMail(link) });

			// Development and end-to-end tests only: never set in production, and
			// the reason it is a separate flag rather than "no mailer configured" is
			// that a missing key must not turn into a sign-in link on screen.
			if (flag(platform?.env, 'AUTH_ECHO_LINK')) return { echoed: link };
		}

		// an unknown address lands here too — the visitor cannot tell the difference
		redirect(303, '/prijava/preveri');
	}
};
