<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';
	import { cx } from './cx';

	type Props = {
		label: string;
		hint?: string;
		error?: string;
		value?: string;
	} & Omit<HTMLTextareaAttributes, 'value'>;

	let {
		label,
		hint,
		error,
		value = $bindable(''),
		id,
		rows = 4,
		class: extra,
		...rest
	}: Props = $props();

	const fieldId = $derived(id ?? `f-${label.toLowerCase().replace(/\W+/g, '-')}`);
</script>

<div class="flex flex-col gap-1.5">
	<label for={fieldId} class="text-sm font-medium">{label}</label>
	<textarea
		id={fieldId}
		bind:value
		{rows}
		aria-invalid={error ? 'true' : undefined}
		class={cx(
			'rounded-control border bg-surface p-3 text-base',
			error ? 'border-danger' : 'border-line',
			extra as string | undefined
		)}
		{...rest}></textarea>
	{#if error}
		<p class="text-sm text-danger">{error}</p>
	{:else if hint}
		<p class="text-sm text-muted">{hint}</p>
	{/if}
</div>
