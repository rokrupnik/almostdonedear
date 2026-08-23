<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { Button } from '$lib/ui';

	/**
	 * The app is the source of truth; WhatsApp is where the link goes (ADR-012).
	 * Web Share where it exists, clipboard where it does not, and the text is
	 * written to be readable on its own in a chat.
	 */
	type Props = { text: string; url: string };
	let { text, url }: Props = $props();

	let copied = $state(false);

	async function share() {
		const payload = { title: 'AlmostDone, Dear', text, url };

		if (typeof navigator !== 'undefined' && navigator.share) {
			try {
				await navigator.share(payload);
				return;
			} catch {
				// the person closed the sheet — falling through to copy is wrong here
				return;
			}
		}

		await navigator.clipboard?.writeText(`${text}\n${url}`);
		copied = true;
		setTimeout(() => (copied = false), 2500);
	}
</script>

<Button variant="secondary" size="sm" onclick={share}>
	{copied ? m.share_copied() : m.share()}
</Button>
