import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: 'e2e',
	testMatch: '**/*.e2e.{ts,js}',
	use: { baseURL: 'http://localhost:4173' },
	webServer: {
		command: 'pnpm run build && pnpm run preview',
		port: 4173,
		reuseExistingServer: !process.env.CI
	}
});
