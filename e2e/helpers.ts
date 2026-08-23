import { execFileSync } from 'node:child_process';
import { expect, type Page } from '@playwright/test';

let counter = 0;

/** Until invitations exist for everyone, the first user of a test is made directly. */
export function createUser(name: string): string {
	const email = `e2e-${Date.now()}-${counter++}@example.com`;
	execFileSync('node', ['scripts/user-create.mjs', '--email', email, '--name', name], {
		stdio: 'ignore'
	});
	return email;
}

/** Follows the emailed link the way a person would — AUTH_ECHO_LINK renders it. */
export async function signIn(page: Page, email: string): Promise<void> {
	await page.goto('/prijava');
	await page.getByLabel('E-pošta').fill(email);
	await page.getByRole('button', { name: 'Pošlji povezavo' }).click();

	const link = page.getByRole('link', { name: /\/prijava\/potrdi/ });
	await expect(link).toBeVisible();
	const href = new URL((await link.getAttribute('href')) ?? '');
	await page.goto(href.pathname + href.search);
}

export function pathOf(absoluteUrl: string): string {
	const url = new URL(absoluteUrl);
	return url.pathname + url.search;
}
