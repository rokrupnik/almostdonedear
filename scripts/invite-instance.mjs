/**
 * Issues an instance invitation — the one that gets a person into the system
 * when they belong to no group yet (ADR-002). Group invitations are made in the
 * app by group admins; this one is the operator's, so it lives in a script.
 *
 *   pnpm run invite:instance
 *   pnpm run invite:instance -- --email someone@example.com --remote
 */
import { execFileSync } from 'node:child_process';
import { webcrypto as crypto } from 'node:crypto';

const args = process.argv.slice(2);
const value = (name) => {
	const i = args.indexOf(`--${name}`);
	return i === -1 ? undefined : args[i + 1];
};
const remote = args.includes('--remote');
const email = value('email')?.trim().toLowerCase() ?? null;
const origin = value('origin') ?? (remote ? 'https://almostdonedear.app' : 'http://localhost:5173');

const d1 = (sql, json = false) =>
	execFileSync(
		'pnpm',
		[
			'exec',
			'wrangler',
			'd1',
			'execute',
			'almostdonedear',
			remote ? '--remote' : '--local',
			...(json ? ['--json'] : []),
			'--command',
			sql
		],
		{ encoding: 'utf8' }
	);

const hex = (bytes) => [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
const token = hex(crypto.getRandomValues(new Uint8Array(32)));
const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
const tokenHash = hex(new Uint8Array(digest));

const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ulid = () => {
	let now = Date.now();
	let time = '';
	for (let i = 9; i >= 0; i--) {
		const mod = now % 32;
		time = ENCODING[mod] + time;
		now = (now - mod) / 32;
	}
	return (
		time + [...crypto.getRandomValues(new Uint8Array(16))].map((b) => ENCODING[b & 31]).join('')
	);
};

// the invite needs an author; the operator is whoever exists first
const raw = d1('select id from user order by created_at limit 1', true);
const rows = JSON.parse(raw.slice(raw.indexOf('[')))[0]?.results ?? [];
if (rows.length === 0) {
	console.error('No user exists yet — run `pnpm run user:create` first.');
	process.exit(1);
}

const quote = (s) => (s === null ? 'null' : `'${String(s).replace(/'/g, "''")}'`);
const expires = Date.now() + 7 * 24 * 60 * 60 * 1000;

d1(
	`insert into instance_invite (id, token_hash, email, created_by, expires_at, created_at)
	 values (${quote(ulid())}, ${quote(tokenHash)}, ${quote(email)}, ${quote(rows[0].id)}, ${expires}, ${Date.now()})`
);

console.log(`\n${origin}/vabilo/${token}\n\nValid for 7 days, single use.`);
