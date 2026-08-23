import { describe, expect, it } from 'vitest';
import { hashToken, newToken, normaliseEmail } from './auth';

describe('sign-in tokens', () => {
	it('are 64 hex characters of randomness', () => {
		expect(newToken()).toMatch(/^[0-9a-f]{64}$/);
		expect(newToken()).not.toBe(newToken());
	});

	it('hash deterministically, and only the hash is ever stored', async () => {
		const token = newToken();
		expect(await hashToken(token)).toBe(await hashToken(token));
		expect(await hashToken(token)).not.toBe(token);
		expect(await hashToken(token)).toMatch(/^[0-9a-f]{64}$/);
	});

	it('hash to different values for different tokens', async () => {
		expect(await hashToken('a')).not.toBe(await hashToken('b'));
	});
});

describe('email normalisation', () => {
	it('trims and lowercases, so one person is one row', () => {
		expect(normaliseEmail('  Rok@Example.COM ')).toBe('rok@example.com');
	});
});
