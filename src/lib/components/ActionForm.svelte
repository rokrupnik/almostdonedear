<script lang="ts">
	import { enhance } from '$app/forms';
	import * as m from '$lib/paraglide/messages';
	import { Button, Card, Input, Textarea } from '$lib/ui';

	type Props = {
		values?: Record<string, unknown>;
		problems?: string[];
		submitLabel: string;
	};

	let { values = {}, problems = [], submitLabel }: Props = $props();

	const text = (name: string) => String(values[name] ?? '');
	const has = (problem: string) => problems.includes(problem);
</script>

<form method="POST" use:enhance class="flex flex-col gap-4">
	<Input
		label={m.action_title_label()}
		name="title"
		required
		value={text('title')}
		error={has('title') ? m.action_title_invalid() : undefined}
	/>

	<Textarea
		label={m.action_description_label()}
		name="description"
		rows={3}
		hint={m.action_description_hint()}
		value={text('description')}
	/>

	<Input
		label={m.action_starts_label()}
		name="startsAt"
		type="datetime-local"
		required
		value={text('startsAt')}
		error={has('starts-at') ? m.action_starts_invalid() : undefined}
	/>

	<Input
		label={m.action_ends_label()}
		name="endsAt"
		type="datetime-local"
		required
		value={text('endsAt')}
		error={has('ends-before-start') ? m.action_ends_invalid() : undefined}
	/>

	<Input
		label={m.action_location_label()}
		name="locationName"
		required
		value={text('locationName')}
		error={has('location') ? m.action_location_invalid() : undefined}
	/>

	<Input
		label={m.action_address_label()}
		name="locationAddress"
		hint={m.action_address_hint()}
		value={text('locationAddress')}
	/>

	<Card title={m.action_headcount()} subtitle={m.action_headcount_hint()}>
		<div class="flex flex-col gap-4">
			<Input
				label={m.action_min_label()}
				name="minParticipants"
				type="number"
				min="1"
				value={text('minParticipants')}
			/>
			<Input
				label={m.action_deadline_label()}
				name="minDecisionAt"
				type="datetime-local"
				value={text('minDecisionAt')}
				error={has('deadline-after-start') ? m.action_deadline_invalid() : undefined}
			/>
			<Input
				label={m.action_max_label()}
				name="maxParticipants"
				type="number"
				min="1"
				value={text('maxParticipants')}
				error={has('max-below-min') ? m.action_max_invalid() : undefined}
			/>
		</div>
	</Card>

	<Button type="submit" full>{submitLabel}</Button>
</form>
