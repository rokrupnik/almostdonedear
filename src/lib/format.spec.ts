import { describe, expect, it } from 'vitest';
import { formatWhen, fromLocalInput, toLocalInput } from './format';

describe('wall-clock times are Ljubljana times', () => {
	it('reads summer time as UTC+2', () => {
		// 08:00 CEST is 06:00 UTC — the bug this replaced stored 08:00 UTC
		expect(fromLocalInput('2026-09-05T08:00')?.toISOString()).toBe('2026-09-05T06:00:00.000Z');
	});

	it('reads winter time as UTC+1', () => {
		expect(fromLocalInput('2026-12-05T08:00')?.toISOString()).toBe('2026-12-05T07:00:00.000Z');
	});

	it('round-trips through the form field', () => {
		for (const wall of ['2026-09-05T08:00', '2026-12-05T08:00', '2026-03-29T04:00']) {
			expect(toLocalInput(fromLocalInput(wall))).toBe(wall);
		}
	});

	it('refuses what is not a date', () => {
		expect(fromLocalInput('')).toBeNull();
		expect(fromLocalInput('jutri ob osmih')).toBeNull();
	});

	it('formats the same instant the same way regardless of the runtime timezone', () => {
		const start = new Date('2026-09-05T06:00:00.000Z');
		const end = new Date('2026-09-05T11:00:00.000Z');
		expect(formatWhen(start, end)).toContain('08:00');
		expect(formatWhen(start, end)).toContain('13:00');
	});
});
