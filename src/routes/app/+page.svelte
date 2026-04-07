<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const user = $derived(data.session?.user);
</script>

<svelte:head><title>App</title></svelte:head>

<div class="space-y-4">
	<h1 class="text-2xl font-bold text-gray-900">Welcome{user?.name ? `, ${user.name}` : ''}!</h1>
	<p class="text-gray-600">You are signed in. This is a protected page.</p>
</div>
