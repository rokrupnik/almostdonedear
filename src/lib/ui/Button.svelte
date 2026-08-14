<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { cx } from './cx';

	type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
	type Size = 'sm' | 'md' | 'lg';

	type Props = {
		variant?: Variant;
		size?: Size;
		/** renders an <a> instead of a <button> */
		href?: string;
		full?: boolean;
		children: Snippet;
	} & Omit<HTMLButtonAttributes & HTMLAnchorAttributes, 'href' | 'size'>;

	let {
		variant = 'primary',
		size = 'md',
		href,
		full = false,
		class: extra,
		children,
		...rest
	}: Props = $props();

	const variants: Record<Variant, string> = {
		primary: 'bg-primary text-inverted hover:bg-primary-hover',
		secondary: 'bg-surface text-ink border border-line hover:bg-sunken',
		ghost: 'text-ink hover:bg-sunken',
		danger: 'bg-danger text-white hover:opacity-90'
	};

	const sizes: Record<Size, string> = {
		sm: 'h-9 px-3 text-sm',
		md: 'h-touch px-4 text-base',
		lg: 'h-12 px-5 text-lg'
	};

	const classes = $derived(
		cx(
			'inline-flex items-center justify-center gap-2 rounded-control font-medium transition',
			'disabled:pointer-events-none disabled:opacity-50',
			variants[variant],
			sizes[size],
			full && 'w-full',
			extra as string | undefined
		)
	);
</script>

{#if href}
	<!-- generic primitive: callers pass an already-resolved path, or an external URL -->
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
	<a {href} class={classes} {...rest}>{@render children()}</a>
{:else}
	<button class={classes} {...rest}>{@render children()}</button>
{/if}
