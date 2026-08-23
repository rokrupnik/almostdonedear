import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';

/**
 * Covers what unit tests cannot reach without a real D1: that a link signs you
 * in, that it works exactly once, and that a forged one does nothing.
 */
const email = `e2e-${Date.now()}@example.com`;

test.beforeAll(() => {
	execFileSync('node', ['scripts/user-create.mjs', '--email', email, '--name', 'E2E Tester'], {
		stdio: 'ignore'
	});
});

/**
 * Returns the confirm path, not the whole link: the echoed URL is built from
 * PUBLIC_ORIGIN, which points at the dev server's port and not at the port this
 * test's worker listens on.
 */
async function requestLink(page: import('@playwright/test').Page): Promise<string> {
	await page.goto('/prijava');
	await page.getByLabel('E-pošta').fill(email);
	await page.getByRole('button', { name: 'Pošlji povezavo' }).click();
	const link = page.getByRole('link', { name: /\/prijava\/potrdi/ });
	await expect(link).toBeVisible();
	const href = (await link.getAttribute('href')) ?? '';
	return new URL(href).pathname + new URL(href).search;
}

test('a mailed link signs you in, once', async ({ page }) => {
	const link = await requestLink(page);

	await page.goto(link);
	await expect(page.getByText('Živjo, E2E Tester')).toBeVisible();

	// same link again: the session is gone and the link is spent
	await page.getByRole('button', { name: 'Odjava' }).click();
	await expect(page.getByRole('link', { name: 'Prijava' })).toBeVisible();

	await page.goto(link);
	await expect(page.getByText(/Ta povezava ne velja več/)).toBeVisible();
});

test('an unknown address reveals nothing', async ({ page }) => {
	await page.goto('/prijava');
	await page.getByLabel('E-pošta').fill('nobody-here@example.com');
	await page.getByRole('button', { name: 'Pošlji povezavo' }).click();
	await expect(page.getByRole('heading', { name: 'Poglej v nabiralnik' })).toBeVisible();
});

test('a forged token is refused', async ({ page }) => {
	await page.goto('/prijava/potrdi?t=' + 'f'.repeat(64));
	await expect(page.getByText(/Ta povezava ne velja več/)).toBeVisible();
});
