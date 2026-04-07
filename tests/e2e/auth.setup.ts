import { test as setup } from '@playwright/test';
import path from 'path';

const authFile = path.join(process.cwd(), 'playwright/.auth/user.json');

setup('authenticate as test user', async ({ page }) => {
	// Navigate to sign-in page
	await page.goto('/signin');
	await page.waitForSelector('input[type="email"]');

	// Fill in credentials (matches the seeded test user)
	await page.fill('input[type="email"]', 'test@example.com');
	await page.fill('input[type="password"]', 'Password123');
	await page.click('button[type="submit"]');

	// Wait for redirect to /app after successful login
	await page.waitForURL('/app');

	// Save the authenticated state
	await page.context().storageState({ path: authFile });
});
