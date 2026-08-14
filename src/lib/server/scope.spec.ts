import { describe, expect, it } from 'vitest';
import { isToolVisible, type Scope } from './scope';

const scope: Scope = { userId: 'u-me', groupId: 'g-1', role: 'member' };
const row = (over: Partial<Parameters<typeof isToolVisible>[0]> = {}) => ({
	groupId: 'g-1',
	visibility: 'group' as const,
	ownerUserId: 'u-other',
	...over
});

describe('tool visibility', () => {
	it('shows group-visible tools to members of that group', () => {
		expect(isToolVisible(row(), scope)).toBe(true);
	});

	it('never crosses a group boundary', () => {
		expect(isToolVisible(row({ groupId: 'g-2' }), scope)).toBe(false);
	});

	it('shows private tools only to their owner', () => {
		expect(isToolVisible(row({ visibility: 'private' }), scope)).toBe(false);
		expect(isToolVisible(row({ visibility: 'private', ownerUserId: 'u-me' }), scope)).toBe(true);
	});

	it('keeps the network scope inert in the MVP (ADR-015)', () => {
		expect(isToolVisible(row({ visibility: 'network' }), scope)).toBe(false);
		expect(isToolVisible(row({ visibility: 'network', ownerUserId: 'u-me' }), scope)).toBe(false);
	});
});
