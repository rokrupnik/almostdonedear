/**
 * The single choke point for tenant scoping (ADR-014).
 *
 * Nothing outside this module composes a `group_id = ?` predicate by hand. That
 * is the whole point: a leak between groups is the most likely serious defect
 * in this design, so there is exactly one place to get it wrong and one place
 * to test.
 */
import { error } from '@sveltejs/kit';
import { and, eq, or, type SQL } from 'drizzle-orm';
import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import type { Db } from './db';
import { membership, tool, type Tool } from './db/schema';

export type Scope = {
	userId: string;
	groupId: string;
	role: 'admin' | 'member';
};

/**
 * Resolves the caller's active membership, or refuses.
 *
 * A `left` membership resolves to nothing: former members keep their place in
 * the history, not their access (FR-8).
 */
export async function resolveScope(db: Db, userId: string, groupId: string): Promise<Scope> {
	const rows = await db
		.select({ role: membership.role })
		.from(membership)
		.where(
			and(
				eq(membership.userId, userId),
				eq(membership.groupId, groupId),
				eq(membership.status, 'active')
			)
		)
		.limit(1);

	const row = rows[0];
	// 404, not 403: whether a group exists is itself scoped information
	if (!row) error(404, 'Not found');

	return { userId, groupId, role: row.role };
}

export function requireAdmin(scope: Scope): void {
	if (scope.role !== 'admin') error(403, 'Admins only');
}

/** The predicate every tenant-scoped query must carry. */
export function inScope(column: AnySQLiteColumn, scope: Scope): SQL {
	return eq(column, scope.groupId) as SQL;
}

/**
 * Tool visibility, resolved in the same place as group scope.
 *
 * `network` is deliberately unreachable in the MVP (ADR-015): the column ships
 * so the model never has to change, the feature does not. Enabling it later is
 * an edit here and nowhere else.
 */
export function visibleTools(scope: Scope): SQL {
	return and(
		inScope(tool.groupId, scope),
		or(
			eq(tool.visibility, 'group'),
			and(eq(tool.visibility, 'private'), eq(tool.ownerUserId, scope.userId))
		)
	) as SQL;
}

/**
 * Pure mirror of {@link visibleTools}, for unit tests and for guarding an
 * already-loaded row. The two must agree; the test suite is what enforces that.
 */
export function isToolVisible(
	row: Pick<Tool, 'groupId' | 'visibility' | 'ownerUserId'>,
	scope: Scope
): boolean {
	if (row.groupId !== scope.groupId) return false;
	if (row.visibility === 'group') return true;
	if (row.visibility === 'private') return row.ownerUserId === scope.userId;
	return false; // network — see ADR-015
}
