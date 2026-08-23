<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { Card } from '$lib/ui';
</script>

<svelte:head><title>{m.auth_check_title()} · AlmostDone, Dear</title></svelte:head>

<main class="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6">
	<h1 class="text-2xl font-semibold tracking-tight">{m.auth_check_title()}</h1>
	<Card>
		<p class="text-muted">{m.auth_check_body()}</p>
	</Card>
</main>
