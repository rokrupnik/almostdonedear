<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import ActionForm from '$lib/components/ActionForm.svelte';
	import * as m from '$lib/paraglide/messages';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>{m.edit()} · {data.title}</title></svelte:head>

<main class="mx-auto flex max-w-md flex-col gap-5 p-6">
	<header class="space-y-1">
		<a
			href={resolve(`/skupine/${page.params.groupId}/akcije/${page.params.actionId}`)}
			class="text-sm text-muted">← {data.title}</a
		>
		<h1 class="text-2xl font-semibold tracking-tight">{m.edit()}</h1>
	</header>

	<ActionForm
		values={form && 'values' in form ? (form.values ?? data.values) : data.values}
		problems={form && 'problems' in form ? (form.problems ?? []) : []}
		submitLabel={m.save()}
	/>
</main>
