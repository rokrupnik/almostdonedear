/**
 * ULIDs — 48-bit timestamp + 80 bits of randomness, Crockford base32.
 *
 * Hand-rolled rather than pulled in as a dependency: it is thirty lines, it has
 * to run on Workers, and an id generator is not something worth tracking
 * upstream releases for.
 */
const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford base32, no I L O U
const TIME_LEN = 10;
const RANDOM_LEN = 16;

function encodeTime(now: number): string {
	if (!Number.isInteger(now) || now < 0 || now > 0xffffffffffff) {
		throw new RangeError(`ulid: timestamp out of range: ${now}`);
	}
	let out = '';
	for (let i = TIME_LEN - 1; i >= 0; i--) {
		const mod = now % 32;
		out = ENCODING[mod] + out;
		now = (now - mod) / 32;
	}
	return out;
}

function encodeRandom(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(RANDOM_LEN));
	let out = '';
	// 256 is a multiple of 32, so masking the low 5 bits stays uniform
	for (const byte of bytes) out += ENCODING[byte & 31];
	return out;
}

/** Monotonic within a millisecond only by luck; ordering across ms is exact. */
export function ulid(now: number = Date.now()): string {
	return encodeTime(now) + encodeRandom();
}

/** Inverse of the timestamp half — used in tests and when debugging ordering. */
export function ulidTime(id: string): number {
	if (id.length !== TIME_LEN + RANDOM_LEN) throw new Error(`ulid: bad length: ${id}`);
	let time = 0;
	for (const char of id.slice(0, TIME_LEN)) {
		const value = ENCODING.indexOf(char);
		if (value === -1) throw new Error(`ulid: bad character: ${char}`);
		time = time * 32 + value;
	}
	return time;
}

/** Opaque session identifier — 32 random bytes, never a ULID (no time leak). */
export function sessionId(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}
