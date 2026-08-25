<script lang="ts">
	import { enhance } from '$app/forms';
	import * as m from '$lib/paraglide/messages';
	import { Button, Card } from '$lib/ui';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>{m.auth_confirm_title()} · AlmostDone, Dear</title></svelte:head>

<main class="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 p-6">
	<h1 class="text-2xl font-semibold tracking-tight">{m.auth_confirm_title()}</h1>

	{#if data.hasToken}
		<Card>
			<p class="text-muted">{m.auth_confirm_body()}</p>
		</Card>
		<form method="POST" use:enhance>
			<Button type="submit" full>{m.auth_confirm_button()}</Button>
		</form>
	{:else}
		<Card><p class="text-sm text-danger">{m.auth_link_dead()}</p></Card>
	{/if}
</main>
