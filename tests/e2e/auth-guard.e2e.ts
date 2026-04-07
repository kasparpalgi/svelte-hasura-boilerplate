import { expect, test } from '@playwright/test';

// These tests run WITHOUT stored auth state (no session cookie).
// The "unauthenticated" project in playwright.config.ts intentionally omits storageState.

test('unauthenticated user is redirected to /signin', async ({ page }) => {
	await page.goto('/app');
	await expect(page).toHaveURL(/\/signin/);
});

test('sign-in page renders the login form', async ({ page }) => {
	await page.goto('/signin');
	await expect(page.locator('h1')).toContainText('Welcome back');
	await expect(page.locator('input[type="email"]')).toBeVisible();
	await expect(page.locator('input[type="password"]')).toBeVisible();
	await expect(page.locator('button[type="submit"]')).toBeVisible();
});
