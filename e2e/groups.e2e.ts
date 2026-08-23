import { expect, test } from '@playwright/test';
import { createUser, pathOf, signIn } from './helpers';

test('a group is created, invited into, and joined', async ({ browser }) => {
	const founder = await browser.newContext();
	const friend = await browser.newContext();

	const founderPage = await founder.newPage();
	await signIn(founderPage, createUser('Ustanovitelj'));

	await founderPage.goto('/skupine');
	await founderPage.getByRole('button', { name: 'Nova skupina' }).click();
	await founderPage.getByLabel('Ime skupine').fill('Vaška moba');
	await founderPage.getByRole('button', { name: 'Ustvari' }).click();

	await expect(founderPage.getByRole('heading', { name: 'Vaška moba' })).toBeVisible();
	const groupPath = new URL(founderPage.url()).pathname;

	// the founder is an admin, alone, and can produce an invitation
	await expect(founderPage.getByText('admin')).toBeVisible();
	await founderPage.getByRole('button', { name: 'Ustvari povezavo' }).click();
	const inviteLink = founderPage.getByRole('link', { name: /\/vabilo\// });
	await expect(inviteLink).toBeVisible();
	const invitePath = pathOf((await inviteLink.getAttribute('href')) ?? '');

	// a second person, already signed in, joins with one click
	const friendPage = await friend.newPage();
	await signIn(friendPage, createUser('Prijatelj'));
	await friendPage.goto(invitePath);
	await friendPage.getByRole('button', { name: 'Pridruži se' }).click();

	await expect(friendPage.getByRole('heading', { name: 'Vaška moba' })).toBeVisible();
	await expect(friendPage.getByText('Ustanovitelj')).toBeVisible();
	await expect(friendPage.getByText('Prijatelj')).toBeVisible();

	// and a spent invitation is spent
	const stranger = await browser.newContext();
	const strangerPage = await stranger.newPage();
	await signIn(strangerPage, createUser('Neznanec'));
	await strangerPage.goto(invitePath);
	await expect(strangerPage.getByRole('heading', { name: 'Vabilo ne velja' })).toBeVisible();

	// ADR-014: a group you are not in does not exist as far as you are concerned
	const response = await strangerPage.goto(groupPath);
	expect(response?.status()).toBe(404);

	await founder.close();
	await friend.close();
	await stranger.close();
});

test('a new person joins by invitation and gets an account', async ({ browser }) => {
	const founder = await browser.newContext();
	const founderPage = await founder.newPage();
	await signIn(founderPage, createUser('Gospodar'));

	await founderPage.goto('/skupine');
	await founderPage.getByRole('button', { name: 'Nova skupina' }).click();
	await founderPage.getByLabel('Ime skupine').fill('Gasilci');
	await founderPage.getByRole('button', { name: 'Ustvari' }).click();
	await founderPage.getByRole('button', { name: 'Ustvari povezavo' }).click();
	const invitePath = pathOf(
		(await founderPage.getByRole('link', { name: /\/vabilo\// }).getAttribute('href')) ?? ''
	);

	const newcomer = await browser.newContext();
	const page = await newcomer.newPage();
	await page.goto(invitePath);
	await page.getByLabel('Ime').fill('Novinec');
	await page.getByLabel('E-pošta').fill(`e2e-newcomer-${Date.now()}@example.com`);
	await page.getByRole('button', { name: 'Sprejmi vabilo' }).click();

	// signed in and a member, without ever seeing a password or an inbox
	await expect(page.getByRole('heading', { name: 'Skupine' })).toBeVisible();
	await expect(page.getByText('Gasilci')).toBeVisible();

	await founder.close();
	await newcomer.close();
});
