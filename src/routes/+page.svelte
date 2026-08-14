<script lang="ts">
	import { dev } from '$app/environment';
	import * as m from '$lib/paraglide/messages';
	import { Button, Card } from '$lib/ui';
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

	<Card title="Status">
		<p class="text-sm text-muted">{m.landing_status()}</p>
	</Card>

	{#if dev}
		<Button href="/dev/ui" variant="secondary" full>Component gallery</Button>
	{/if}
</main>
