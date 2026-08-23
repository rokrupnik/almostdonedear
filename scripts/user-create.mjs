/**
 * Creates a user directly in D1, because until invitations exist (T-26-008)
 * there is no other way in — sign-in refuses unknown addresses on purpose.
 *
 *   pnpm run user:create -- --email rok@example.com --name Rok
 *   pnpm run user:create -- --email rok@example.com --name Rok --remote
 */
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const value = (name) => {
	const i = args.indexOf(`--${name}`);
	return i === -1 ? undefined : args[i + 1];
};

const email = value('email')?.trim().toLowerCase();
const name = value('name')?.trim();
const remote = args.includes('--remote');

if (!email || !name) {
	console.error(
		'usage: pnpm run user:create -- --email <address> --name <display name> [--remote]'
	);
	process.exit(2);
}

// mirrors ulid() in src/lib/server/ids.ts — ten lines beats importing TypeScript
const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ulid = () => {
	let now = Date.now();
	let time = '';
	for (let i = 9; i >= 0; i--) {
		const mod = now % 32;
		time = ENCODING[mod] + time;
		now = (now - mod) / 32;
	}
	const bytes = crypto.getRandomValues(new Uint8Array(16));
	return time + [...bytes].map((b) => ENCODING[b & 31]).join('');
};

const quote = (s) => `'${s.replace(/'/g, "''")}'`;
const sql = `insert into user (id, display_name, email, locale, notify_email, notify_push, created_at)
values (${quote(ulid())}, ${quote(name)}, ${quote(email)}, 'sl', 1, 1, ${Date.now()})`;

execFileSync(
	'pnpm',
	[
		'exec',
		'wrangler',
		'd1',
		'execute',
		'almostdonedear',
		remote ? '--remote' : '--local',
		'--command',
		sql
	],
	{ stdio: 'inherit' }
);

console.log(`\n${email} created ${remote ? 'in production' : 'locally'}.`);
