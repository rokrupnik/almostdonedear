import { expect, test } from '@playwright/test';

test('landing page renders', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: 'AlmostDone, Dear' })).toBeVisible();
});

test('the component gallery does not exist in a production build', async ({ page }) => {
	const response = await page.goto('/dev/ui');
	expect(response?.status()).toBe(404);
});
