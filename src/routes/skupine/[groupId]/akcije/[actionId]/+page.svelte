<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import ShareAction from '$lib/components/ShareAction.svelte';
	import { formatWhen } from '$lib/format';
	import * as m from '$lib/paraglide/messages';
	import { Badge, Button, Card, CheckRow, EmptyState, Input, ListRow } from '$lib/ui';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const groupId = $derived(page.params.groupId);
	const isDraft = $derived(data.action.status === 'draft');
	const shareText = $derived(
		`${data.action.title} — ${formatWhen(data.action.startsAt, data.action.endsAt)}, ${data.action.locationName}`
	);
	const mapUrl = $derived(
		`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
			[data.action.locationName, data.action.locationAddress].filter(Boolean).join(', ')
		)}`
	);
</script>

<svelte:head><title>{data.action.title} · AlmostDone, Dear</title></svelte:head>

<main class="mx-auto flex max-w-md flex-col gap-5 p-6">
	<header class="space-y-1">
		<a href={resolve(`/skupine/${groupId}/akcije`)} class="text-sm text-muted">
			← {m.actions_title()}
		</a>
		<div class="flex items-start justify-between gap-3">
			<h1 class="text-2xl font-semibold tracking-tight">{data.action.title}</h1>
			{#if isDraft}<Badge>{m.status_draft()}</Badge>{/if}
		</div>
		<p class="text-muted">{formatWhen(data.action.startsAt, data.action.endsAt)}</p>
		<p class="text-muted">
			{data.action.locationName}{#if data.action.locationAddress}, {data.action
					.locationAddress}{/if}
			·
			<!-- an external map, deliberately not an embedded one (FR-11) -->
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<a href={mapUrl} target="_blank" rel="noreferrer">{m.action_map()}</a>
		</p>
	</header>

	{#if data.action.status === 'published'}
		<Card title={m.rsvp_title()} subtitle={m.rsvp_tally({ ...data.tally })}>
			<div class="flex gap-2">
				{#each [['yes', m.rsvp_yes()], ['maybe', m.rsvp_maybe()], ['no', m.rsvp_no()]] as [value, label] (value)}
					<form method="POST" action="?/respond" use:enhance class="flex-1">
						<input type="hidden" name="response" {value} />
						<Button
							type="submit"
							full
							size="sm"
							variant={data.myResponse === value ? 'primary' : 'secondary'}
						>
							{label}
						</Button>
					</form>
				{/each}
			</div>

			{#if data.answers.length > 0}
				<ul class="mt-3 flex flex-col gap-1 text-sm">
					{#each data.answers as answer (answer.userId)}
						<li class="flex items-center justify-between gap-2">
							<span>{answer.displayName}</span>
							<Badge
								tone={answer.response === 'yes'
									? 'ok'
									: answer.response === 'maybe'
										? 'warn'
										: 'neutral'}
							>
								{answer.response === 'yes'
									? m.rsvp_yes()
									: answer.response === 'maybe'
										? m.rsvp_maybe()
										: m.rsvp_no()}
							</Badge>
						</li>
					{/each}
				</ul>
			{/if}

			{#if data.action.minParticipants}
				<p class="mt-3 text-sm text-muted">
					{m.rsvp_minimum({ n: data.action.minParticipants })}
				</p>
			{/if}
		</Card>
	{/if}

	{#if data.action.description}
		<Card><p class="whitespace-pre-line">{data.action.description}</p></Card>
	{/if}

	{#if form && 'needsTask' in form && form.needsTask}
		<Card><p class="text-sm text-danger">{m.action_needs_task()}</p></Card>
	{/if}

	<!-- The task list is the answer to "what am I signing up for", so it comes
	     before everything else on the page (FR-12). -->
	<Card title={m.action_tasks()} subtitle={m.action_tasks_hint()}>
		{#if data.tasks.length === 0}
			<EmptyState title={m.action_tasks_empty()} body={m.action_tasks_empty_hint()} />
		{:else}
			{#each data.tasks as task (task.id)}
				<div class="flex items-center gap-1">
					<form method="POST" action="?/toggleTask" use:enhance class="flex-1">
						<input type="hidden" name="id" value={task.id} />
						<input type="hidden" name="done" value={task.doneAt ? 'false' : 'true'} />
						<button type="submit" class="w-full text-left">
							<CheckRow
								label={task.title}
								checked={Boolean(task.doneAt)}
								note={task.doneByName ?? undefined}
							/>
						</button>
					</form>
					{#if data.canEdit}
						<form method="POST" action="?/removeTask" use:enhance>
							<input type="hidden" name="id" value={task.id} />
							<Button size="sm" variant="ghost" type="submit">×</Button>
						</form>
					{/if}
				</div>
			{/each}
		{/if}

		{#if data.canEdit}
			<form method="POST" action="?/addTask" use:enhance class="mt-3 flex items-end gap-2">
				<div class="flex-1"><Input label={m.action_task_new()} name="title" /></div>
				<Button size="sm" type="submit">{m.add()}</Button>
			</form>
		{/if}
	</Card>

	<Card title={m.action_equipment()} subtitle={m.action_equipment_hint()}>
		{#if data.equipment.length === 0}
			<p class="py-2 text-sm text-muted">{m.action_equipment_empty()}</p>
		{:else}
			{#each data.equipment as item (item.id)}
				<ListRow title={item.label} meta={item.broughtByName ?? undefined}>
					{#snippet trailing()}
						<span class="flex items-center gap-1">
							<form method="POST" action="?/claimEquipment" use:enhance>
								<input type="hidden" name="id" value={item.id} />
								<input
									type="hidden"
									name="claim"
									value={item.broughtBy === data.me ? 'false' : 'true'}
								/>
								<Button
									size="sm"
									variant={item.broughtBy === data.me ? 'ghost' : 'secondary'}
									type="submit"
								>
									{item.broughtBy === data.me ? m.action_unclaim() : m.action_claim()}
								</Button>
							</form>
							{#if data.canEdit}
								<form method="POST" action="?/removeEquipment" use:enhance>
									<input type="hidden" name="id" value={item.id} />
									<Button size="sm" variant="ghost" type="submit">×</Button>
								</form>
							{/if}
						</span>
					{/snippet}
				</ListRow>
			{/each}
		{/if}

		{#if data.canEdit}
			<form method="POST" action="?/addEquipment" use:enhance class="mt-3 flex items-end gap-2">
				<div class="flex-1"><Input label={m.action_equipment_new()} name="label" /></div>
				<Button size="sm" type="submit">{m.add()}</Button>
			</form>
		{/if}
	</Card>

	<div class="flex flex-wrap items-center gap-2">
		{#if data.action.status === 'published'}
			<ShareAction text={shareText} url={page.url.href} />
		{/if}
	</div>

	{#if data.canEdit}
		<div class="flex flex-wrap items-center gap-2">
			{#if isDraft}
				<form method="POST" action="?/publish" use:enhance>
					<Button type="submit">{m.action_publish()}</Button>
				</form>
			{/if}
			<Button
				variant="secondary"
				size="sm"
				href={`/skupine/${groupId}/akcije/${data.action.id}/uredi`}
			>
				{m.edit()}
			</Button>
			<form method="POST" action="?/duplicate" use:enhance>
				<Button variant="ghost" size="sm" type="submit">{m.action_duplicate()}</Button>
			</form>
		</div>
	{/if}
</main>
