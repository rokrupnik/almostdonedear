<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { cx } from './cx';

	type Props = {
		label: string;
		hint?: string;
		error?: string;
		value?: string;
	} & Omit<HTMLInputAttributes, 'value'>;

	let { label, hint, error, value = $bindable(''), id, class: extra, ...rest }: Props = $props();

	const fieldId = $derived(id ?? `f-${label.toLowerCase().replace(/\W+/g, '-')}`);
</script>

<div class="flex flex-col gap-1.5">
	<label for={fieldId} class="text-sm font-medium">{label}</label>
	<input
		id={fieldId}
		bind:value
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={hint || error ? `${fieldId}-note` : undefined}
		class={cx(
			'h-touch rounded-control border bg-surface px-3 text-base',
			error ? 'border-danger' : 'border-line',
			extra as string | undefined
		)}
		{...rest}
	/>
	{#if error}
		<p id="{fieldId}-note" class="text-sm text-danger">{error}</p>
	{:else if hint}
		<p id="{fieldId}-note" class="text-sm text-muted">{hint}</p>
	{/if}
</div>
