<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cx } from './cx';

	type Props = {
		title: string;
		meta?: string;
		href?: string;
		leading?: Snippet;
		trailing?: Snippet;
	};

	let { title, meta, href, leading, trailing }: Props = $props();

	const classes =
		'flex min-h-touch w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-sunken';
</script>

{#snippet body()}
	{@render leading?.()}
	<span class="flex min-w-0 flex-1 flex-col">
		<span class="truncate font-medium">{title}</span>
		{#if meta}<span class="truncate text-sm text-muted">{meta}</span>{/if}
	</span>
	{@render trailing?.()}
{/snippet}

{#if href}
	<!-- generic primitive: callers pass an already-resolved path, or an external URL -->
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
	<a {href} class={cx(classes, 'text-ink no-underline')}>{@render body()}</a>
{:else}
	<div class={classes}>{@render body()}</div>
{/if}
