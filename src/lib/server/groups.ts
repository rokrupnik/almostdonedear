/**
 * Groups, memberships and the two kinds of invitation (ADR-002, ADR-003).
 *
 * Everything here takes either a user id (for the "which groups am I in"
 * questions, which cannot be scoped by definition) or a Scope from
 * src/lib/server/scope.ts. No route composes a group predicate by hand.
 */
import { and, count, desc, eq, isNull } from 'drizzle-orm';
import { hashToken, newToken } from './auth';
import type { Db } from './db';
import { groupInvite, groups, instanceInvite, membership, user } from './db/schema';
import { requireAdmin, type Scope } from './scope';

export const INVITE_TTL_DAYS = 7;

export type GroupCard = {
	id: string;
	name: string;
	description: string | null;
	role: 'admin' | 'member';
	members: number;
};

export async function myGroups(db: Db, userId: string): Promise<GroupCard[]> {
	const rows = await db
		.select({
			id: groups.id,
			name: groups.name,
			description: groups.description,
			role: membership.role
		})
		.from(membership)
		.innerJoin(groups, eq(groups.id, membership.groupId))
		.where(and(eq(membership.userId, userId), eq(membership.status, 'active')))
		.orderBy(groups.name);

	return Promise.all(rows.map(async (row) => ({ ...row, members: await memberCount(db, row.id) })));
}

async function memberCount(db: Db, groupId: string): Promise<number> {
	const [row] = await db
		.select({ n: count() })
		.from(membership)
		.where(and(eq(membership.groupId, groupId), eq(membership.status, 'active')));
	return row?.n ?? 0;
}

export async function createGroup(
	db: Db,
	input: { userId: string; name: string; description?: string | null }
): Promise<string> {
	const [group] = await db
		.insert(groups)
		.values({
			name: input.name.trim(),
			description: input.description?.trim() || null,
			createdBy: input.userId
		})
		.returning({ id: groups.id });

	// the founder is the first admin, and for a while the only one (FR-5)
	await db.insert(membership).values({
		groupId: group.id,
		userId: input.userId,
		role: 'admin',
		status: 'active'
	});

	return group.id;
}

export type Member = {
	userId: string;
	displayName: string;
	role: 'admin' | 'member';
	joinedAt: Date;
};

export async function members(db: Db, scope: Scope): Promise<Member[]> {
	return db
		.select({
			userId: user.id,
			displayName: user.displayName,
			role: membership.role,
			joinedAt: membership.joinedAt
		})
		.from(membership)
		.innerJoin(user, eq(user.id, membership.userId))
		.where(and(eq(membership.groupId, scope.groupId), eq(membership.status, 'active')))
		.orderBy(desc(membership.role), user.displayName);
}

export async function group(db: Db, scope: Scope) {
	const [row] = await db.select().from(groups).where(eq(groups.id, scope.groupId)).limit(1);
	return row ?? null;
}

async function adminCount(db: Db, groupId: string): Promise<number> {
	const [row] = await db
		.select({ n: count() })
		.from(membership)
		.where(
			and(
				eq(membership.groupId, groupId),
				eq(membership.status, 'active'),
				eq(membership.role, 'admin')
			)
		);
	return row?.n ?? 0;
}

/**
 * SQLite cannot express "this group always has an admin", so it lives here —
 * and it is checked before every departure, not only the obvious one.
 */
export async function isLastAdmin(db: Db, groupId: string, userId: string): Promise<boolean> {
	const [row] = await db
		.select({ role: membership.role })
		.from(membership)
		.where(
			and(
				eq(membership.groupId, groupId),
				eq(membership.userId, userId),
				eq(membership.status, 'active')
			)
		)
		.limit(1);

	if (row?.role !== 'admin') return false;
	return (await adminCount(db, groupId)) <= 1;
}

/** A soft leave: the history keeps the name, the catalogue loses the tools (FR-8). */
export async function leave(db: Db, groupId: string, userId: string): Promise<void> {
	await db
		.update(membership)
		.set({ status: 'left', leftAt: new Date() })
		.where(and(eq(membership.groupId, groupId), eq(membership.userId, userId)));
}

export async function removeMember(db: Db, scope: Scope, userId: string): Promise<void> {
	requireAdmin(scope);
	await leave(db, scope.groupId, userId);
}

export async function promote(db: Db, scope: Scope, userId: string): Promise<void> {
	requireAdmin(scope);
	await db
		.update(membership)
		.set({ role: 'admin' })
		.where(and(eq(membership.groupId, scope.groupId), eq(membership.userId, userId)));
}

/* -------------------------------------------------------------------------- */
/* Invitations                                                                */
/* -------------------------------------------------------------------------- */

export async function createInvite(
	db: Db,
	scope: Scope,
	options: { maxUses?: number } = {}
): Promise<string> {
	requireAdmin(scope);
	const token = newToken();
	await db.insert(groupInvite).values({
		groupId: scope.groupId,
		tokenHash: await hashToken(token),
		createdBy: scope.userId,
		expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
		maxUses: options.maxUses ?? 1
	});
	return token;
}

export async function openInvites(db: Db, scope: Scope) {
	return db
		.select({
			id: groupInvite.id,
			createdAt: groupInvite.createdAt,
			expiresAt: groupInvite.expiresAt,
			maxUses: groupInvite.maxUses,
			usedCount: groupInvite.usedCount
		})
		.from(groupInvite)
		.where(and(eq(groupInvite.groupId, scope.groupId), isNull(groupInvite.revokedAt)))
		.orderBy(desc(groupInvite.createdAt));
}

export async function revokeInvite(db: Db, scope: Scope, inviteId: string): Promise<void> {
	requireAdmin(scope);
	await db
		.update(groupInvite)
		.set({ revokedAt: new Date() })
		.where(and(eq(groupInvite.id, inviteId), eq(groupInvite.groupId, scope.groupId)));
}

export type FoundInvite =
	| { kind: 'group'; id: string; groupId: string; groupName: string }
	| { kind: 'instance'; id: string; email: string | null }
	| null;

/** Both kinds of invitation share one URL, so one lookup answers both. */
export async function findInvite(db: Db, token: string): Promise<FoundInvite> {
	const hash = await hashToken(token);
	const now = new Date();

	const [g] = await db
		.select({
			id: groupInvite.id,
			groupId: groupInvite.groupId,
			groupName: groups.name,
			expiresAt: groupInvite.expiresAt,
			maxUses: groupInvite.maxUses,
			usedCount: groupInvite.usedCount,
			revokedAt: groupInvite.revokedAt
		})
		.from(groupInvite)
		.innerJoin(groups, eq(groups.id, groupInvite.groupId))
		.where(eq(groupInvite.tokenHash, hash))
		.limit(1);

	if (g && !g.revokedAt && g.expiresAt > now && g.usedCount < g.maxUses) {
		return { kind: 'group', id: g.id, groupId: g.groupId, groupName: g.groupName };
	}

	const [i] = await db
		.select()
		.from(instanceInvite)
		.where(eq(instanceInvite.tokenHash, hash))
		.limit(1);

	if (i && !i.usedAt && i.expiresAt > now) {
		return { kind: 'instance', id: i.id, email: i.email };
	}

	return null;
}

export type RedeemResult = 'joined' | 'already-member' | 'invalid';

export async function redeemGroupInvite(
	db: Db,
	token: string,
	userId: string
): Promise<{ result: RedeemResult; groupId?: string }> {
	const invite = await findInvite(db, token);
	if (!invite || invite.kind !== 'group') return { result: 'invalid' };

	const [existing] = await db
		.select({ status: membership.status })
		.from(membership)
		.where(and(eq(membership.groupId, invite.groupId), eq(membership.userId, userId)))
		.limit(1);

	if (existing?.status === 'active') return { result: 'already-member', groupId: invite.groupId };

	if (existing) {
		// a returning member: the old row comes back rather than a second one
		await db
			.update(membership)
			.set({ status: 'active', leftAt: null, joinedAt: new Date() })
			.where(and(eq(membership.groupId, invite.groupId), eq(membership.userId, userId)));
	} else {
		await db.insert(membership).values({
			groupId: invite.groupId,
			userId,
			role: 'member',
			status: 'active'
		});
	}

	await db
		.update(groupInvite)
		.set({ usedCount: (await usedCount(db, invite.id)) + 1 })
		.where(eq(groupInvite.id, invite.id));

	return { result: 'joined', groupId: invite.groupId };
}

async function usedCount(db: Db, inviteId: string): Promise<number> {
	const [row] = await db
		.select({ usedCount: groupInvite.usedCount })
		.from(groupInvite)
		.where(eq(groupInvite.id, inviteId))
		.limit(1);
	return row?.usedCount ?? 0;
}

export async function consumeInstanceInvite(
	db: Db,
	inviteId: string,
	userId: string
): Promise<void> {
	await db
		.update(instanceInvite)
		.set({ usedAt: new Date(), usedBy: userId })
		.where(and(eq(instanceInvite.id, inviteId), isNull(instanceInvite.usedAt)));
}

/** Used by the invite screen: an address that already exists must not be taken over. */
export async function findUserByEmail(db: Db, email: string) {
	const [row] = await db.select().from(user).where(eq(user.email, email)).limit(1);
	return row && !row.anonymisedAt ? row : null;
}
