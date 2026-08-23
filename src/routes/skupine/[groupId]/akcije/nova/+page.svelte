<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import ActionForm from '$lib/components/ActionForm.svelte';
	import * as m from '$lib/paraglide/messages';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	const groupId = $derived(page.params.groupId);
</script>

<svelte:head><title>{m.actions_call()} · AlmostDone, Dear</title></svelte:head>

<main class="mx-auto flex max-w-md flex-col gap-5 p-6">
	<header class="space-y-1">
		<a href={resolve(`/skupine/${groupId}/akcije`)} class="text-sm text-muted">
			← {m.actions_title()}
		</a>
		<h1 class="text-2xl font-semibold tracking-tight">{m.actions_call()}</h1>
		<p class="text-muted">{m.actions_call_hint()}</p>
	</header>

	<ActionForm
		values={form && 'values' in form ? (form.values ?? {}) : {}}
		problems={form && 'problems' in form ? (form.problems ?? []) : []}
		submitLabel={m.actions_save_draft()}
	/>
</main>
