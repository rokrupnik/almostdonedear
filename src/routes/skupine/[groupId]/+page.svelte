<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import * as m from '$lib/paraglide/messages';
	import { Badge, Button, Card, ListRow } from '$lib/ui';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const isAdmin = $derived(data.role === 'admin');
</script>

<svelte:head><title>{data.group?.name} · AlmostDone, Dear</title></svelte:head>

<main class="mx-auto flex max-w-md flex-col gap-5 p-6">
	<header class="space-y-1">
		<a href={resolve('/skupine')} class="text-sm text-muted">← {m.groups_title()}</a>
		<h1 class="text-2xl font-semibold tracking-tight">{data.group?.name}</h1>
		{#if data.group?.description}
			<p class="text-muted">{data.group.description}</p>
		{/if}
	</header>

	{#if form && 'lastAdmin' in form && form.lastAdmin}
		<Card><p class="text-sm text-danger">{m.groups_last_admin()}</p></Card>
	{/if}

	<Button href={`/skupine/${data.group?.id}/akcije`} full>{m.actions_title()}</Button>

	<Card title={m.groups_members()}>
		{#each data.members as member (member.userId)}
			<ListRow title={member.displayName} meta={member.userId === data.me ? m.you() : undefined}>
				{#snippet trailing()}
					<span class="flex items-center gap-2">
						{#if member.role === 'admin'}<Badge tone="ok">{m.role_admin()}</Badge>{/if}
						{#if isAdmin && member.userId !== data.me}
							<form method="POST" action="?/promote" use:enhance>
								<input type="hidden" name="userId" value={member.userId} />
								{#if member.role !== 'admin'}
									<Button size="sm" variant="ghost" type="submit">{m.groups_promote()}</Button>
								{/if}
							</form>
							<form method="POST" action="?/remove" use:enhance>
								<input type="hidden" name="userId" value={member.userId} />
								<Button size="sm" variant="ghost" type="submit">{m.groups_remove()}</Button>
							</form>
						{/if}
					</span>
				{/snippet}
			</ListRow>
		{/each}
	</Card>

	{#if isAdmin}
		<Card title={m.invite_title()} subtitle={m.invite_subtitle()}>
			<form method="POST" action="?/invite" use:enhance>
				<Button size="sm" type="submit">{m.invite_create()}</Button>
			</form>

			{#if form && 'link' in form && form.link}
				<p class="mt-3 text-sm break-all">
					<!-- absolute URL for sharing, not an internal route -->
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a href={String(form.link)}>{form.link}</a>
				</p>
				<p class="mt-1 text-xs text-muted">{m.invite_hint()}</p>
			{/if}

			{#if data.invites.length > 0}
				<ul class="mt-3 flex flex-col gap-2">
					{#each data.invites as invite (invite.id)}
						<li class="flex items-center justify-between gap-2 text-sm">
							<span class="text-muted">
								{m.invite_uses({ used: invite.usedCount, max: invite.maxUses })}
							</span>
							<form method="POST" action="?/revoke" use:enhance>
								<input type="hidden" name="id" value={invite.id} />
								<Button size="sm" variant="ghost" type="submit">{m.invite_revoke()}</Button>
							</form>
						</li>
					{/each}
				</ul>
			{/if}
		</Card>
	{/if}

	<form method="POST" action="?/leave" use:enhance>
		<Button variant="ghost" size="sm" type="submit">{m.groups_leave()}</Button>
	</form>
</main>
