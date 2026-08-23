/**
 * Passwordless sign-in (ADR-010), hand-rolled (ADR-022).
 *
 * The rules this file exists to keep, all of them from T-26-007:
 *  - only a hash of a token is ever stored, and lookup happens *by* that hash,
 *    so no secret is ever compared in JavaScript and there is no timing edge
 *  - single use, enforced by the `usedAt is null` predicate on the claiming
 *    update, so two simultaneous clicks cannot both win
 *  - short expiry, and requests are rate limited per address and per IP
 *  - session ids come from getRandomValues and carry no timestamp
 */
import { and, count, eq, gte, isNull } from 'drizzle-orm';
import type { Db } from './db';
import { loginToken, session, user, type User } from './db/schema';
import { sessionId } from './ids';

export const SESSION_COOKIE = 'ad_session';
export const TOKEN_TTL_MS = 15 * 60 * 1000;
export const SESSION_TTL_MS = 60 * 24 * 60 * 60 * 1000;

/** Rate limits, per rolling hour. Generous for a person, useless as a cannon. */
const RATE_WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_EMAIL = 5;
const MAX_PER_IP = 20;

/** Refresh `last_seen_at` at most this often — it drives the inactivity sweep. */
const LAST_SEEN_INTERVAL_MS = 12 * 60 * 60 * 1000;

const encoder = new TextEncoder();

export function normaliseEmail(raw: string): string {
	return raw.trim().toLowerCase();
}

/** Same shape as a session id, but a different purpose, so a different function. */
export function newToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hashToken(token: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', encoder.encode(token));
	return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export type SignInRequest =
	| { status: 'sent'; token: string; user: User }
	/** the address is unknown — the caller must still say "check your inbox" */
	| { status: 'unknown' }
	| { status: 'rate-limited' };

/**
 * Never reveals whether an address is known: entry is by invitation (ADR-002),
 * so an unknown address is not an error the visitor is allowed to distinguish.
 */
export async function requestSignIn(
	db: Db,
	input: { email: string; ip?: string | null }
): Promise<SignInRequest> {
	const email = normaliseEmail(input.email);
	const since = new Date(Date.now() - RATE_WINDOW_MS);

	const [byEmail] = await db
		.select({ n: count() })
		.from(loginToken)
		.where(and(eq(loginToken.email, email), gte(loginToken.createdAt, since)));
	if ((byEmail?.n ?? 0) >= MAX_PER_EMAIL) return { status: 'rate-limited' };

	if (input.ip) {
		const [byIp] = await db
			.select({ n: count() })
			.from(loginToken)
			.where(and(eq(loginToken.requestedIp, input.ip), gte(loginToken.createdAt, since)));
		if ((byIp?.n ?? 0) >= MAX_PER_IP) return { status: 'rate-limited' };
	}

	const [found] = await db.select().from(user).where(eq(user.email, email)).limit(1);
	if (!found || found.anonymisedAt) return { status: 'unknown' };

	const token = newToken();
	await db.insert(loginToken).values({
		tokenHash: await hashToken(token),
		email,
		expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
		requestedIp: input.ip ?? null
	});

	return { status: 'sent', token, user: found };
}

/**
 * Claims a token and opens a session, or returns null. Every failure — unknown,
 * expired, already used — looks the same to the caller on purpose.
 */
export async function consumeToken(
	db: Db,
	rawToken: string,
	userAgent?: string | null
): Promise<{ sessionId: string; user: User } | null> {
	const [row] = await db
		.select()
		.from(loginToken)
		.where(eq(loginToken.tokenHash, await hashToken(rawToken)))
		.limit(1);

	if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) return null;

	// the `usedAt is null` predicate is what makes this single-use under a race
	const claimed = await db
		.update(loginToken)
		.set({ usedAt: new Date() })
		.where(and(eq(loginToken.id, row.id), isNull(loginToken.usedAt)))
		.returning({ id: loginToken.id });
	if (claimed.length === 0) return null;

	const [found] = await db.select().from(user).where(eq(user.email, row.email)).limit(1);
	if (!found || found.anonymisedAt) return null;

	const id = sessionId();
	await db.insert(session).values({
		id,
		userId: found.id,
		expiresAt: new Date(Date.now() + SESSION_TTL_MS),
		lastUsedAt: new Date(),
		userAgent: userAgent?.slice(0, 255) ?? null
	});

	return { sessionId: id, user: found };
}

export async function validateSession(db: Db, id: string): Promise<User | null> {
	const [row] = await db
		.select({ session: session, user: user })
		.from(session)
		.innerJoin(user, eq(session.userId, user.id))
		.where(eq(session.id, id))
		.limit(1);

	if (!row) return null;
	if (row.session.expiresAt.getTime() < Date.now()) {
		await destroySession(db, id);
		return null;
	}
	if (row.user.anonymisedAt) {
		await destroySession(db, id);
		return null;
	}

	const now = Date.now();
	const lastSeen = row.user.lastSeenAt?.getTime() ?? 0;
	if (now - lastSeen > LAST_SEEN_INTERVAL_MS) {
		await db
			.update(user)
			.set({ lastSeenAt: new Date(now) })
			.where(eq(user.id, row.user.id));
		await db
			.update(session)
			.set({ lastUsedAt: new Date(now) })
			.where(eq(session.id, id));
	}

	return row.user;
}

/** Revocation has to be read-after-write, which is why sessions live in D1. */
export async function destroySession(db: Db, id: string): Promise<void> {
	await db.delete(session).where(eq(session.id, id));
}
