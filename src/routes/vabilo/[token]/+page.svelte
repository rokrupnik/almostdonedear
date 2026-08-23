<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import * as m from '$lib/paraglide/messages';
	import { Button, Card, Input } from '$lib/ui';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>{m.invite_page_title()} · AlmostDone, Dear</title></svelte:head>

<main class="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 p-6">
	{#if !data.invite}
		<h1 class="text-2xl font-semibold tracking-tight">{m.invite_dead_title()}</h1>
		<Card><p class="text-muted">{m.invite_dead_body()}</p></Card>
	{:else if form && 'existingAccount' in form && form.existingAccount}
		<h1 class="text-2xl font-semibold tracking-tight">{m.invite_existing_title()}</h1>
		<Card><p class="text-muted">{m.invite_existing_body()}</p></Card>
	{:else}
		<h1 class="text-2xl font-semibold tracking-tight">
			{data.invite.kind === 'group'
				? m.invite_join_group({ name: data.invite.groupName })
				: m.invite_page_title()}
		</h1>

		{#if data.signedIn}
			<form method="POST" action="?/join" use:enhance>
				<Button type="submit" full>{m.invite_join()}</Button>
			</form>
		{:else}
			<Card>
				<p class="mb-4 text-sm text-muted">{m.invite_form_intro()}</p>
				<form method="POST" action="?/accept" use:enhance class="flex flex-col gap-4">
					<Input
						label={m.invite_name()}
						name="name"
						required
						value={form && 'name' in form ? String(form.name ?? '') : ''}
					/>
					<Input
						label={m.auth_email_label()}
						name="email"
						type="email"
						autocomplete="email"
						required
						value={form && 'email' in form ? String(form.email ?? '') : ''}
						error={form && 'invalid' in form && form.invalid ? m.invite_invalid() : undefined}
					/>
					<Button type="submit">{m.invite_accept()}</Button>
				</form>
			</Card>
			<p class="text-center text-sm text-muted">
				<a href={resolve('/prijava')}>{m.invite_have_account()}</a>
			</p>
		{/if}
	{/if}
</main>
