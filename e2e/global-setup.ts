import { execFileSync } from 'node:child_process';

/**
 * Every sign-in in this suite comes from the same address as far as the app is
 * concerned, so a few consecutive runs trip the per-IP rate limit — the limit
 * working correctly, with the test suite cast as the attacker. Clearing the
 * local token table is the honest fix: production keeps the strict limit, and
 * the tests start from a known state.
 */
export default function globalSetup() {
	execFileSync(
		'pnpm',
		[
			'exec',
			'wrangler',
			'd1',
			'execute',
			'almostdonedear',
			'--local',
			'--command',
			'delete from login_token'
		],
		{ stdio: 'ignore' }
	);
}
