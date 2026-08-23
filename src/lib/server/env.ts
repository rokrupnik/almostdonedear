/**
 * `wrangler types` narrows `vars` to their literal values, which is right for
 * config and wrong for a flag whose whole point is to differ per environment.
 * One place that reads them as plain strings, rather than a cast at each site.
 */
export function flag(env: Env | undefined, name: string): boolean {
	return (env as unknown as Record<string, string | undefined> | undefined)?.[name] === '1';
}

export function origin(env: Env | undefined, fallback: string): string {
	const value = (env as unknown as Record<string, string | undefined> | undefined)?.PUBLIC_ORIGIN;
	return value || fallback;
}
