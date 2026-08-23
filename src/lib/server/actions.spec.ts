import { describe, expect, it } from 'vitest';
import { canEdit, canSee, validate } from './actions';
import type { Scope } from './scope';

const admin: Scope = { userId: 'u-admin', groupId: 'g', role: 'admin' };
const member: Scope = { userId: 'u-member', groupId: 'g', role: 'member' };
const caller: Scope = { userId: 'u-caller', groupId: 'g', role: 'member' };

const at = (iso: string) => new Date(iso);

describe('action validation', () => {
	const valid = {
		title: 'Sekanje drv',
		locationName: 'Pri Janezu',
		startsAt: at('2026-09-05T08:00'),
		endsAt: at('2026-09-05T14:00')
	};

	it('accepts a sensible action', () => {
		expect(validate(valid)).toEqual([]);
	});

	it('refuses an end before the start', () => {
		expect(validate({ ...valid, endsAt: at('2026-09-05T07:00') })).toContain('ends-before-start');
	});

	it('refuses a decision deadline after the action has begun', () => {
		expect(
			validate({ ...valid, minParticipants: 5, minDecisionAt: at('2026-09-06T08:00') })
		).toContain('deadline-after-start');
	});

	it('refuses a ceiling below the floor', () => {
		expect(validate({ ...valid, minParticipants: 8, maxParticipants: 4 })).toContain(
			'max-below-min'
		);
	});

	it('needs a title and a place', () => {
		expect(validate({ ...valid, title: 'a' })).toContain('title');
		expect(validate({ ...valid, locationName: '' })).toContain('location');
	});
});

describe('who may see and edit', () => {
	const draft = { createdBy: 'u-caller', status: 'draft' };
	const published = { createdBy: 'u-caller', status: 'published' };

	it('lets the caller and an admin edit, and nobody else', () => {
		expect(canEdit(draft, caller)).toBe(true);
		expect(canEdit(draft, admin)).toBe(true);
		expect(canEdit(draft, member)).toBe(false);
	});

	it('hides a draft from other members, but never a published action', () => {
		expect(canSee(draft, member)).toBe(false);
		expect(canSee(draft, caller)).toBe(true);
		expect(canSee(draft, admin)).toBe(true);
		expect(canSee(published, member)).toBe(true);
	});
});
