import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: {
		command: 'npm run dev', // For production: 'npm run build && npm run preview',
		port: 5173, // 4173 for production
		reuseExistingServer: true
	},
	testMatch: '**/*.e2e.{ts,js}',

	use: {
		baseURL: 'http://localhost:5173',
		channel: 'chrome',
		headless: false // set `true` if you don't want to see the browser to be opened
	},

	projects: [
		// 1. Login once and save auth state
		{ name: 'setup', testMatch: '**/auth.setup.ts' },

		// 2. Tests that must run without a session (redirect guard, login form rendering)
		{
			name: 'unauthenticated',
			testMatch: '**/auth-guard.e2e.ts'
			// no storageState — deliberately unauthenticated
		},

		// 3. All other tests run with a stored session
		{
			name: 'authenticated',
			testMatch: '**/*.e2e.{ts,js}',
			testIgnore: ['**/auth-guard.e2e.ts', '**/auth.setup.ts'],
			use: { storageState: 'playwright/.auth/user.json' },
			dependencies: ['setup']
		}
	]
});
