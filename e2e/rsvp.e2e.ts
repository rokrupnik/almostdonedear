import { expect, test } from '@playwright/test';
import { createUser, pathOf, signIn } from './helpers';

/**
 * The MVP thesis in one test: a work day is called in the app, and the person
 * who is coming says so in the app rather than in a WhatsApp thread.
 */
test('a published action collects answers', async ({ browser }) => {
	const callerContext = await browser.newContext();
	const caller = await callerContext.newPage();
	await signIn(caller, createUser('Sklicatelj'));

	await caller.goto('/skupine');
	await caller.getByRole('button', { name: 'Nova skupina' }).click();
	await caller.getByLabel('Ime skupine').fill('Kmetija');
	await caller.getByRole('button', { name: 'Ustvari' }).click();
	await expect(caller.getByRole('heading', { name: 'Kmetija' })).toBeVisible();
	const groupPath = new URL(caller.url()).pathname;

	await caller.getByRole('button', { name: 'Ustvari povezavo' }).click();
	const invitePath = pathOf(
		(await caller.getByRole('link', { name: /\/vabilo\// }).getAttribute('href')) ?? ''
	);

	await caller.goto(`${groupPath}/akcije/nova`);
	await caller.getByLabel('Naslov akcije').fill('Košnja');
	await caller.getByLabel('Začetek').fill('2026-09-19T07:00');
	await caller.getByLabel('Predviden konec').fill('2026-09-19T13:00');
	await caller.getByLabel('Kje').fill('Zgornji travnik');
	await caller.getByLabel('Najmanj udeležencev').fill('3');
	await caller.getByRole('button', { name: 'Shrani osnutek' }).click();
	await expect(caller.getByRole('heading', { name: 'Košnja' })).toBeVisible();
	const actionPath = new URL(caller.url()).pathname;

	await caller.getByLabel('Novo opravilo').fill('Nabrusiti kose');
	await caller.getByRole('button', { name: 'Dodaj' }).first().click();
	await caller.getByRole('button', { name: 'Objavi' }).click();
	await expect(caller.getByText('Prideš?')).toBeVisible();
	await expect(caller.getByText('Akcija potrebuje vsaj 3 ljudi.')).toBeVisible();

	// a second member joins and answers
	const friendContext = await browser.newContext();
	const friend = await friendContext.newPage();
	await signIn(friend, createUser('Prijatelj'));
	await friend.goto(invitePath);
	await friend.getByRole('button', { name: 'Pridruži se' }).click();

	await friend.goto(actionPath);
	await friend.getByRole('button', { name: 'Pridem' }).click();
	await expect(friend.getByText('1 pride · 0 mogoče · 0 ne more')).toBeVisible();

	// changing your mind replaces the answer instead of adding one
	await friend.getByRole('button', { name: 'Mogoče' }).click();
	await expect(friend.getByText('0 pride · 1 mogoče · 0 ne more')).toBeVisible();

	// and the caller sees who answered what
	await caller.reload();
	await expect(caller.getByText('Prijatelj')).toBeVisible();
	await expect(caller.getByText('0 pride · 1 mogoče · 0 ne more')).toBeVisible();

	// a second action, called once the friend is already a member, is the one that
	// actually produces an email — the first had nobody but its caller to tell
	await caller.goto(`${groupPath}/akcije/nova`);
	await caller.getByLabel('Naslov akcije').fill('Spravilo sena');
	await caller.getByLabel('Začetek').fill('2026-09-26T07:00');
	await caller.getByLabel('Predviden konec').fill('2026-09-26T12:00');
	await caller.getByLabel('Kje').fill('Zgornji travnik');
	await caller.getByRole('button', { name: 'Shrani osnutek' }).click();
	await expect(caller.getByRole('heading', { name: 'Spravilo sena' })).toBeVisible();
	await caller.getByLabel('Novo opravilo').fill('Pripraviti prikolico');
	await caller.getByRole('button', { name: 'Dodaj' }).first().click();
	await caller.getByRole('button', { name: 'Objavi' }).click();
	await expect(caller.getByText('Prideš?')).toBeVisible();

	await callerContext.close();
	await friendContext.close();
});
