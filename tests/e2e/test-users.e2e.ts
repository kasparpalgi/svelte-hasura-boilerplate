import { expect, test } from '@playwright/test';

test('displays seeded test user on /test-users', async ({ page }) => {
	await page.goto('/test-users');
	await expect(page.locator('h1')).toHaveText('Users');
	await expect(page.locator('[data-testid="user-item"]').first()).toBeVisible();
	await expect(page.locator('[data-testid="user-item"]').first()).toContainText('Test User');
	await expect(page.locator('[data-testid="user-item"]').first()).toContainText('test@example.com');
});
