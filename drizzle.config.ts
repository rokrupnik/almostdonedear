import { defineConfig } from 'drizzle-kit';

/**
 * `db:generate` works without credentials — it only reads the schema.
 * `db:push` and `db:studio` talk to the remote D1 over HTTP and need all three
 * values from .env; migrations against local and remote D1 go through
 * `wrangler d1 migrations apply` instead.
 */
export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle',
	dialect: 'sqlite',
	driver: 'd1-http',
	dbCredentials: {
		accountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? '',
		databaseId: process.env.CLOUDFLARE_DATABASE_ID ?? '',
		token: process.env.CLOUDFLARE_D1_TOKEN ?? ''
	},
	verbose: true,
	strict: true
});
