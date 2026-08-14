<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cx } from './cx';

	/**
	 * Status colour is load-bearing in exactly one place — loan state — so the
	 * tones are named after meaning, never after the colour itself.
	 */
	type Tone = 'neutral' | 'ok' | 'warn' | 'danger' | 'info';

	type Props = { tone?: Tone; children: Snippet };

	let { tone = 'neutral', children }: Props = $props();

	const tones: Record<Tone, string> = {
		neutral: 'bg-sunken text-muted',
		ok: 'bg-primary-soft text-primary',
		warn: 'bg-warn-soft text-warn',
		danger: 'bg-danger-soft text-danger',
		info: 'bg-info-soft text-info'
	};
</script>

<span
	class={cx(
		'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
		tones[tone]
	)}
>
	{@render children()}
</span>
