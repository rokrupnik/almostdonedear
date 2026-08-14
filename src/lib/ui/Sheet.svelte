<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * Bottom sheet on phones, centred dialog from `sm` up. Built on <dialog> so
	 * focus trapping, Escape and inertness come from the platform rather than
	 * from us.
	 */
	type Props = {
		open?: boolean;
		title: string;
		children: Snippet;
		footer?: Snippet;
	};

	let { open = $bindable(false), title, children, footer }: Props = $props();

	let el: HTMLDialogElement | undefined = $state();

	$effect(() => {
		if (!el) return;
		if (open && !el.open) el.showModal();
		if (!open && el.open) el.close();
	});
</script>

<dialog
	bind:this={el}
	onclose={() => (open = false)}
	class="m-0 mt-auto w-full max-w-md rounded-t-card bg-surface text-ink
	       backdrop:bg-black/40 sm:m-auto sm:rounded-card"
>
	<header class="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
		<h2 class="font-semibold">{title}</h2>
		<button
			type="button"
			onclick={() => (open = false)}
			aria-label="Close"
			class="flex size-9 items-center justify-center rounded-control hover:bg-sunken"
		>
			✕
		</button>
	</header>
	<div class="px-4 py-4">{@render children()}</div>
	{#if footer}
		<footer class="flex justify-end gap-2 border-t border-line px-4 py-3">
			{@render footer()}
		</footer>
	{/if}
</dialog>
