<script lang="ts">
	import { resolve } from '$app/paths';
	import { formatWhen } from '$lib/format';
	import * as m from '$lib/paraglide/messages';
	import { Badge, Button, Card, EmptyState, ListRow } from '$lib/ui';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>{m.actions_title()} · {data.group?.name}</title></svelte:head>

<main class="mx-auto flex max-w-md flex-col gap-5 p-6">
	<header class="space-y-1">
		<a href={resolve(`/skupine/${data.group?.id}`)} class="text-sm text-muted">
			← {data.group?.name}
		</a>
		<div class="flex items-center justify-between gap-3">
			<h1 class="text-2xl font-semibold tracking-tight">{m.actions_title()}</h1>
			<Button size="sm" href={`/skupine/${data.group?.id}/akcije/nova`}>{m.actions_call()}</Button>
		</div>
	</header>

	{#if data.actions.length === 0}
		<Card>
			<EmptyState title={m.actions_empty_title()} body={m.actions_empty_body()} />
		</Card>
	{:else}
		<Card>
			{#each data.actions as item (item.id)}
				<ListRow
					title={item.title}
					meta={`${formatWhen(item.startsAt, item.endsAt)} · ${item.locationName}`}
					href={`/skupine/${data.group?.id}/akcije/${item.id}`}
				>
					{#snippet trailing()}
						{#if item.status === 'draft'}<Badge>{m.status_draft()}</Badge>{/if}
					{/snippet}
				</ListRow>
			{/each}
		</Card>
	{/if}
</main>
