import { fail, redirect } from '@sveltejs/kit';
import { SESSION_COOKIE, SESSION_TTL_MS, normaliseEmail, openSession } from '$lib/server/auth';
import { dbFrom } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { mailer, signInMail } from '$lib/server/email';
import { origin } from '$lib/server/env';
import {
	consumeInstanceInvite,
	findInvite,
	findUserByEmail,
	redeemGroupInvite
} from '$lib/server/groups';
import { requestSignIn } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, platform, locals }) => {
	const invite = await findInvite(dbFrom(platform), params.token);

	// expired, revoked, spent and never-existed are one answer on purpose
	if (!invite) return { invite: null, signedIn: Boolean(locals.user) };

	return {
		invite:
			invite.kind === 'group'
				? { kind: 'group' as const, groupName: invite.groupName }
				: { kind: 'instance' as const },
		signedIn: Boolean(locals.user)
	};
};

export const actions: Actions = {
	/** Already signed in: joining is one click, and no account is created. */
	join: async ({ params, platform, locals }) => {
		if (!locals.user) redirect(303, '/prijava');
		const db = dbFrom(platform);
		const invite = await findInvite(db, params.token);
		if (!invite) return fail(410, { dead: true });

		if (invite.kind === 'instance') {
			await consumeInstanceInvite(db, invite.id, locals.user.id);
			redirect(303, '/skupine');
		}

		const { result, groupId } = await redeemGroupInvite(db, params.token, locals.user.id);
		if (result === 'invalid') return fail(410, { dead: true });
		redirect(303, `/skupine/${groupId}`);
	},

	/** Not signed in: the invitation is the credential, so it may create an account. */
	accept: async ({ params, platform, request, cookies, getClientAddress }) => {
		const db = dbFrom(platform);
		const invite = await findInvite(db, params.token);
		if (!invite) return fail(410, { dead: true });

		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const email = normaliseEmail(String(form.get('email') ?? ''));

		if (name.length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
			return fail(400, { name, email, invalid: true });
		}

		const existing = await findUserByEmail(db, email);

		// An address that already has an account must never be signed in from an
		// invite link — otherwise anyone holding one could type a member's address
		// and become them. Send that person a sign-in link instead.
		if (existing) {
			const result = await requestSignIn(db, { email, ip: getClientAddress() });
			if (result.status === 'sent' && result.user.email) {
				const link = `${origin(platform?.env, new URL(request.url).origin)}/prijava/potrdi?t=${result.token}`;
				await mailer(platform?.env).send({ to: result.user.email, ...signInMail(link) });
			}
			return { existingAccount: true };
		}

		const [created] = await db
			.insert(user)
			.values({ displayName: name, email, lastSeenAt: new Date() })
			.returning({ id: user.id });

		if (invite.kind === 'instance') {
			await consumeInstanceInvite(db, invite.id, created.id);
		} else {
			await redeemGroupInvite(db, params.token, created.id);
		}

		const sessionId = await openSession(db, created.id, request.headers.get('user-agent'));
		cookies.set(SESSION_COOKIE, sessionId, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: Math.floor(SESSION_TTL_MS / 1000)
		});

		redirect(303, '/skupine');
	}
};
