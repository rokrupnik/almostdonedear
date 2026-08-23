import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: 'e2e',
	globalSetup: './e2e/global-setup.ts',
	testMatch: '**/*.e2e.{ts,js}',
	// One worker: the suite seeds users through `wrangler d1 execute --local`,
	// which writes to the same SQLite file the running worker holds open, and
	// parallel writers trip its lock.
	workers: 1,
	use: { baseURL: 'http://localhost:4173' },
	webServer: {
		command: 'pnpm run build && pnpm run preview',
		port: 4173,
		reuseExistingServer: !process.env.CI
	}
});
