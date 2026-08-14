<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cx } from './cx';

	type Props = {
		title?: string;
		subtitle?: string;
		header?: Snippet;
		footer?: Snippet;
		children: Snippet;
		class?: string;
	};

	let { title, subtitle, header, footer, children, class: extra }: Props = $props();
</script>

<section class={cx('rounded-card border border-line bg-surface', extra)}>
	{#if title || header}
		<header class="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
			<div class="min-w-0">
				{#if title}<h2 class="truncate font-semibold">{title}</h2>{/if}
				{#if subtitle}<p class="truncate text-sm text-muted">{subtitle}</p>{/if}
			</div>
			{@render header?.()}
		</header>
	{/if}
	<div class="px-4 py-3">{@render children()}</div>
	{#if footer}
		<footer class="border-t border-line px-4 py-3">{@render footer()}</footer>
	{/if}
</section>
