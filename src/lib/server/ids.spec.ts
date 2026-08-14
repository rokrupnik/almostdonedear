import { describe, expect, it } from 'vitest';
import { sessionId, ulid, ulidTime } from './ids';

describe('ulid', () => {
	it('is 26 Crockford base32 characters', () => {
		expect(ulid()).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
	});

	it('round-trips the timestamp', () => {
		const now = 1_755_000_000_000;
		expect(ulidTime(ulid(now))).toBe(now);
	});

	it('sorts lexicographically by time', () => {
		const earlier = ulid(1_000_000_000_000);
		const later = ulid(1_000_000_001_000);
		expect([later, earlier].sort()).toEqual([earlier, later]);
	});

	it('does not repeat', () => {
		const ids = new Set(Array.from({ length: 1000 }, () => ulid()));
		expect(ids.size).toBe(1000);
	});
});

describe('sessionId', () => {
	it('is 64 hex characters and carries no timestamp', () => {
		const a = sessionId();
		expect(a).toMatch(/^[0-9a-f]{64}$/);
		expect(a).not.toBe(sessionId());
	});
});
