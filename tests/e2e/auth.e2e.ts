import { expect, test } from '@playwright/test';

// These tests run WITH stored auth state (authenticated project).

test('authenticated user can access /app', async ({ page }) => {
	await page.goto('/app');
	await expect(page).not.toHaveURL(/\/signin/);
	await expect(page.locator('h1')).toContainText('Welcome');
});

test('authenticated user is redirected away from /signin', async ({ page }) => {
	await page.goto('/signin');
	await expect(page).toHaveURL('/app');
});
