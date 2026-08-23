/**
 * Secrets are set with `wrangler secret put`, so they never appear in
 * wrangler.jsonc and `wrangler types` cannot know about them. Declaring them
 * here keeps the generated Env honest — and gives one list of what production
 * expects to find.
 */
declare global {
	interface Env {
		/** Resend, ADR-011. Absent in development: mail goes to the terminal. */
		RESEND_API_KEY?: string;
		/** Web Push, phase 4. */
		VAPID_PUBLIC_KEY?: string;
		VAPID_PRIVATE_KEY?: string;
	}
}

export {};
