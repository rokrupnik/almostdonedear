<script lang="ts">
	import { enhance } from '$app/forms';
	import * as m from '$lib/paraglide/messages';
	import { Button, Card, Input } from '$lib/ui';
	import type { ActionData } from './$types';

	import { page } from '$app/state';

	let { form }: { form: ActionData } = $props();

	const deadLink = $derived(page.url.searchParams.get('napaka') === 'povezava');
</script>

<svelte:head><title>{m.auth_title()} · AlmostDone, Dear</title></svelte:head>

<main class="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-6">
	<div class="space-y-2">
		<h1 class="text-2xl font-semibold tracking-tight">{m.auth_title()}</h1>
		<p class="text-muted">{m.auth_intro()}</p>
	</div>

	{#if deadLink}
		<Card><p class="text-sm text-danger">{m.auth_link_dead()}</p></Card>
	{/if}

	<form method="POST" use:enhance class="flex flex-col gap-4">
		<Input
			label={m.auth_email_label()}
			name="email"
			type="email"
			autocomplete="email"
			inputmode="email"
			required
			value={form && 'email' in form ? String(form.email ?? '') : ''}
			error={form && 'invalid' in form && form.invalid
				? m.auth_email_invalid()
				: form && 'rateLimited' in form && form.rateLimited
					? m.auth_rate_limited()
					: undefined}
		/>
		<Button type="submit" full>{m.auth_submit()}</Button>
	</form>

	{#if form && 'echoed' in form && form.echoed}
		<Card title="Razvojna povezava">
			<p class="text-sm text-muted">
				Pošte ni bilo treba čakati — to vidiš samo, ker je vklopljen <code>AUTH_ECHO_LINK</code>.
			</p>
			<!-- an absolute URL built by the server, not a route in this app -->
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<p class="mt-2 text-sm break-all"><a href={String(form.echoed)}>{form.echoed}</a></p>
		</Card>
	{/if}
</main>
