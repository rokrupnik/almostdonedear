import { describe, expect, it } from 'vitest';
import { headcountState, tally, type Answer } from './rsvp';

const answers = (...responses: Answer['response'][]): Answer[] =>
	responses.map((response, i) => ({ userId: `u${i}`, displayName: `P${i}`, response }));

describe('tally', () => {
	it('counts each answer separately, and ignores silence', () => {
		expect(tally(answers('yes', 'yes', 'maybe', 'no', null))).toEqual({ yes: 2, maybe: 1, no: 1 });
	});
});

describe('headcount', () => {
	const counts = { yes: 4, maybe: 2, no: 1 };

	it('is short of the floor when fewer said yes', () => {
		expect(headcountState(counts, 6, null)).toBe('short');
	});

	it('is full at the ceiling, not one past it', () => {
		expect(headcountState(counts, null, 4)).toBe('full');
		expect(headcountState(counts, null, 5)).toBe('ok');
	});

	it('is fine when neither is set — most actions set neither', () => {
		expect(headcountState(counts, null, null)).toBe('ok');
	});

	it('counts only yes, never maybe: a maybe is not a person on the day', () => {
		expect(headcountState({ yes: 1, maybe: 9, no: 0 }, 5, null)).toBe('short');
	});
});
