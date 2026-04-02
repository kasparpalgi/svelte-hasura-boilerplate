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
	}
});
