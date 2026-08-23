<script lang="ts">
	import { enhance } from '$app/forms';
	import * as m from '$lib/paraglide/messages';
	import { Button, Card, EmptyState, Input, ListRow, Textarea } from '$lib/ui';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let creating = $state(false);
</script>

<svelte:head><title>{m.groups_title()} · AlmostDone, Dear</title></svelte:head>

<main class="mx-auto flex max-w-md flex-col gap-5 p-6">
	<header class="flex items-center justify-between gap-3">
		<h1 class="text-2xl font-semibold tracking-tight">{m.groups_title()}</h1>
		<Button size="sm" variant="secondary" onclick={() => (creating = !creating)}>
			{m.groups_new()}
		</Button>
	</header>

	{#if creating}
		<Card title={m.groups_new()}>
			<form method="POST" action="?/create" use:enhance class="flex flex-col gap-4">
				<Input
					label={m.groups_name()}
					name="name"
					required
					value={form && 'name' in form ? String(form.name ?? '') : ''}
					error={form && 'invalid' in form && form.invalid ? m.groups_name_invalid() : undefined}
				/>
				<Textarea label={m.groups_description()} name="description" rows={2} />
				<Button type="submit">{m.groups_create()}</Button>
			</form>
		</Card>
	{/if}

	{#if data.groups.length === 0}
		<Card>
			<EmptyState title={m.groups_empty_title()} body={m.groups_empty_body()} />
		</Card>
	{:else}
		<Card>
			{#each data.groups as group (group.id)}
				<ListRow
					title={group.name}
					meta={m.groups_member_count({ n: group.members }) +
						(group.role === 'admin' ? ' · ' + m.role_admin() : '')}
					href={`/skupine/${group.id}`}
				/>
			{/each}
		</Card>
	{/if}
</main>
