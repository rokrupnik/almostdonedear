import { expect, test } from '@playwright/test';
import { createUser, pathOf, signIn } from './helpers';

async function makeGroup(page: import('@playwright/test').Page, name: string): Promise<string> {
	await page.goto('/skupine');
	await page.getByRole('button', { name: 'Nova skupina' }).click();
	await page.getByLabel('Ime skupine').fill(name);
	await page.getByRole('button', { name: 'Ustvari' }).click();
	await expect(page.getByRole('heading', { name })).toBeVisible();
	return new URL(page.url()).pathname;
}

test('a work day is drafted, given tasks, and published', async ({ page }) => {
	await signIn(page, createUser('Sklicatelj'));
	const groupPath = await makeGroup(page, 'Sadovnjak');

	await page.goto(`${groupPath}/akcije`);
	await page.getByRole('link', { name: 'Skliči akcijo' }).click();

	await page.getByLabel('Naslov akcije').fill('Obiranje jabolk');
	await page.getByLabel('Začetek').fill('2026-09-12T08:00');
	await page.getByLabel('Predviden konec').fill('2026-09-12T15:00');
	await page.getByLabel('Kje').fill('Pri Tonetu');
	await page.getByRole('button', { name: 'Shrani osnutek' }).click();

	await expect(page.getByRole('heading', { name: 'Obiranje jabolk' })).toBeVisible();
	await expect(page.getByText('osnutek')).toBeVisible();

	// FR-12: publishing without a task is refused by the server, not the form
	await page.getByRole('button', { name: 'Objavi' }).click();
	await expect(
		page.getByText('Akcije brez enega samega opravila ni mogoče objaviti')
	).toBeVisible();

	await page.getByLabel('Novo opravilo').fill('Prinesti lestve');
	await page.getByRole('button', { name: 'Dodaj' }).first().click();
	await expect(page.getByText('Prinesti lestve')).toBeVisible();

	await page.getByRole('button', { name: 'Objavi' }).click();
	await expect(page.getByText('osnutek')).toBeHidden();

	// and it shows up in the group's list of what is coming
	await page.goto(`${groupPath}/akcije`);
	await expect(page.getByText('Obiranje jabolk')).toBeVisible();
	await expect(page.getByText('Pri Tonetu')).toBeVisible();
});

test('a draft is invisible to the rest of the group', async ({ browser }) => {
	const founderContext = await browser.newContext();
	const founderPage = await founderContext.newPage();
	await signIn(founderPage, createUser('Ustanovitelj'));
	const groupPath = await makeGroup(founderPage, 'Gozd');

	await founderPage.getByRole('button', { name: 'Ustvari povezavo' }).click();
	const invitePath = pathOf(
		(await founderPage.getByRole('link', { name: /\/vabilo\// }).getAttribute('href')) ?? ''
	);

	await founderPage.goto(`${groupPath}/akcije/nova`);
	await founderPage.getByLabel('Naslov akcije').fill('Tajni osnutek');
	await founderPage.getByLabel('Začetek').fill('2026-10-01T09:00');
	await founderPage.getByLabel('Predviden konec').fill('2026-10-01T12:00');
	await founderPage.getByLabel('Kje').fill('Gozdna cesta');
	await founderPage.getByRole('button', { name: 'Shrani osnutek' }).click();
	// wait for the redirect to land before reading the URL — enhance submits async
	await expect(founderPage.getByRole('heading', { name: 'Tajni osnutek' })).toBeVisible();
	const draftPath = new URL(founderPage.url()).pathname;

	const memberContext = await browser.newContext();
	const memberPage = await memberContext.newPage();
	await signIn(memberPage, createUser('Član'));
	await memberPage.goto(invitePath);
	await memberPage.getByRole('button', { name: 'Pridruži se' }).click();

	await memberPage.goto(`${groupPath}/akcije`);
	await expect(memberPage.getByText('Tajni osnutek')).toBeHidden();

	const response = await memberPage.goto(draftPath);
	expect(response?.status()).toBe(404);

	await founderContext.close();
	await memberContext.close();
});
