<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cx } from './cx';

	/**
	 * The task tick, and the attendance tick. Deliberately a whole-row target:
	 * this gets used outdoors, one-handed, sometimes with gloves on (NFR-9), and
	 * it is one of the two operations that also works offline (FR-38).
	 */
	type Props = {
		label: string;
		checked?: boolean;
		disabled?: boolean;
		/** small line under the label — assignee, quantity, whatever fits */
		note?: string;
		pending?: boolean;
		onchange?: (checked: boolean) => void;
		trailing?: Snippet;
	};

	let {
		label,
		checked = $bindable(false),
		disabled = false,
		note,
		pending = false,
		onchange,
		trailing
	}: Props = $props();
</script>

<label
	class={cx(
		'flex min-h-touch cursor-pointer items-center gap-3 rounded-control px-3 py-2 transition',
		disabled ? 'opacity-50' : 'hover:bg-sunken'
	)}
>
	<input
		type="checkbox"
		bind:checked
		{disabled}
		onchange={() => onchange?.(checked)}
		class="size-6 shrink-0 accent-[var(--app-primary)]"
	/>
	<span class="flex min-w-0 flex-col">
		<span class={cx('truncate', checked && 'text-muted line-through')}>{label}</span>
		{#if note}<span class="truncate text-sm text-muted">{note}</span>{/if}
	</span>
	<span class="ml-auto flex items-center gap-2">
		{#if pending}
			<span class="text-xs text-muted" title="Waiting for connection">↻</span>
		{/if}
		{@render trailing?.()}
	</span>
</label>
