<script lang="ts">
	import {
		Badge,
		Button,
		Card,
		CheckRow,
		EmptyState,
		Input,
		ListRow,
		Sheet,
		Textarea
	} from '$lib/ui';

	let sheetOpen = $state(false);
	let sample = $state('Zamenjava letev na ograji');
	let checked = $state(false);
</script>

<svelte:head><title>UI · AlmostDone, Dear</title></svelte:head>

<main class="mx-auto flex max-w-2xl flex-col gap-8 p-6">
	<header>
		<h1 class="text-2xl font-semibold">Component gallery</h1>
		<p class="text-sm text-muted">
			Every component and every state on one page. If a screen needs something that is not here, it
			gets added here first.
		</p>
	</header>

	<section class="flex flex-col gap-3">
		<h2 class="text-sm font-semibold tracking-wide text-muted uppercase">Buttons</h2>
		<div class="flex flex-wrap items-center gap-2">
			<Button>Skliči akcijo</Button>
			<Button variant="secondary">Prekliči</Button>
			<Button variant="ghost">Podvoji</Button>
			<Button variant="danger">Odpovej</Button>
			<Button disabled>Zasedeno</Button>
		</div>
		<div class="flex flex-wrap items-center gap-2">
			<Button size="sm">Majhen</Button>
			<Button size="md">Srednji</Button>
			<Button size="lg">Velik</Button>
		</div>
	</section>

	<section class="flex flex-col gap-3">
		<h2 class="text-sm font-semibold tracking-wide text-muted uppercase">Status</h2>
		<div class="flex flex-wrap gap-2">
			<Badge>osnutek</Badge>
			<Badge tone="ok">na voljo</Badge>
			<Badge tone="info">rezervirano</Badge>
			<Badge tone="warn">izposojeno</Badge>
			<Badge tone="danger">rok potekel</Badge>
		</div>
	</section>

	<section class="flex flex-col gap-4">
		<h2 class="text-sm font-semibold tracking-wide text-muted uppercase">Form</h2>
		<Input label="Naslov akcije" bind:value={sample} hint="Kratko in konkretno." />
		<Input label="E-pošta" type="email" error="Vnesi veljaven naslov." />
		<Textarea label="Opis" hint="Kaj bo treba postoriti in kaj naj ljudje prinesejo." />
	</section>

	<section class="flex flex-col gap-2">
		<h2 class="text-sm font-semibold tracking-wide text-muted uppercase">Tasks</h2>
		<Card>
			<CheckRow label="Pripraviti drva" note="Miha" bind:checked />
			<CheckRow label="Pokositi sadovnjak" note="nihče še" />
			<CheckRow label="Popraviti ograjo" note="čaka na povezavo" pending checked />
			<CheckRow label="Odpeljati vejevje" disabled />
		</Card>
	</section>

	<section class="flex flex-col gap-2">
		<h2 class="text-sm font-semibold tracking-wide text-muted uppercase">List</h2>
		<Card>
			<ListRow title="Motorna žaga Husqvarna" meta="Janez · v garaži">
				{#snippet trailing()}<Badge tone="ok">na voljo</Badge>{/snippet}
			</ListRow>
			<ListRow title="Betonski mešalec" meta="pri Mihi od 12. 3.">
				{#snippet trailing()}<Badge tone="danger">rok potekel</Badge>{/snippet}
			</ListRow>
			<ListRow title="Kosilnica" meta="skupna last" href="/dev/ui">
				{#snippet trailing()}<Badge tone="warn">izposojeno</Badge>{/snippet}
			</ListRow>
		</Card>
	</section>

	<section class="flex flex-col gap-2">
		<h2 class="text-sm font-semibold tracking-wide text-muted uppercase">Empty</h2>
		<Card>
			<EmptyState title="Nobene akcije ni sklicane" body="Ko jo skliče kdorkoli, se prikaže tukaj.">
				{#snippet action()}<Button size="sm">Skliči prvo</Button>{/snippet}
			</EmptyState>
		</Card>
	</section>

	<section class="flex flex-col items-start gap-2">
		<h2 class="text-sm font-semibold tracking-wide text-muted uppercase">Sheet</h2>
		<Button variant="secondary" onclick={() => (sheetOpen = true)}>Odpri</Button>
		<Sheet bind:open={sheetOpen} title="Podaljšaj izposojo">
			<p class="text-sm text-muted">Za koliko časa še potrebuješ orodje?</p>
			{#snippet footer()}
				<Button variant="ghost" onclick={() => (sheetOpen = false)}>Prekliči</Button>
				<Button onclick={() => (sheetOpen = false)}>Podaljšaj za teden</Button>
			{/snippet}
		</Sheet>
	</section>
</main>
