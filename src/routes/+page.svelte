<script lang="ts">
	import { dev } from '$app/environment';
	import { resolve } from '$app/paths';
	import * as m from '$lib/paraglide/messages';
	import { Button, Card } from '$lib/ui';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>AlmostDone, Dear</title>
	<meta name="description" content={m.landing_tagline()} />
</svelte:head>

<main class="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-6">
	<div class="space-y-2">
		<h1 class="text-3xl font-semibold tracking-tight">AlmostDone, Dear</h1>
		<p class="text-lg">{m.landing_tagline()}</p>
		<p class="text-muted">{m.landing_body()}</p>
	</div>

	{#if data.user}
		<Card title={m.greeting({ name: data.user.displayName })}>
			<p class="text-sm text-muted">{m.landing_status()}</p>
			{#snippet footer()}
				<form method="POST" action="?/odjava">
					<Button variant="secondary" size="sm" type="submit">{m.sign_out()}</Button>
				</form>
			{/snippet}
		</Card>
	{:else}
		<Card title="Status">
			<p class="text-sm text-muted">{m.landing_status()}</p>
		</Card>
		<Button href={resolve('/prijava')} full>{m.auth_title()}</Button>
	{/if}

	{#if dev}
		<Button href={resolve('/dev/ui')} variant="ghost" size="sm">Component gallery</Button>
	{/if}
</main>
