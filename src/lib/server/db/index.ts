import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export const getDb = (d1: D1Database) => drizzle(d1, { schema });

export type Db = ReturnType<typeof getDb>;

/**
 * The binding is only absent when wrangler.jsonc and the deployment disagree —
 * fail loudly there rather than at the first query.
 */
export function dbFrom(platform: App.Platform | undefined): Db {
	const d1 = platform?.env?.DB;
	if (!d1) throw new Error('D1 binding "DB" is missing — check wrangler.jsonc');
	return getDb(d1);
}

export * as schema from './schema';
