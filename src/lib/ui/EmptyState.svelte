<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		title: string;
		body?: string;
		action?: Snippet;
	};

	let { title, body, action }: Props = $props();
</script>

<div class="flex flex-col items-center gap-3 px-6 py-10 text-center">
	<h2 class="font-semibold">{title}</h2>
	{#if body}<p class="max-w-sm text-sm text-muted">{body}</p>{/if}
	{@render action?.()}
</div>
