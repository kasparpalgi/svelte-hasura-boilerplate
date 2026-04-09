<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends HTMLInputAttributes {
		label?: string;
		error?: string;
		hint?: string;
		value?: string | number | null;
	}

	let {
		label,
		error,
		hint,
		id,
		value = $bindable(''),
		class: className = '',
		...rest
	}: Props = $props();
</script>

<div class="space-y-1.5">
	{#if label}
		<label for={id} class="block text-xs font-semibold uppercase tracking-widest text-gray-500">
			{label}
		</label>
	{/if}
	<input
		{id}
		bind:value
		class="w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition focus:outline-none focus:ring-1 {error
			? 'border-red-300 bg-red-50/40 focus:border-red-500 focus:ring-red-500'
			: 'border-gray-200 bg-white focus:border-brand-500 focus:ring-brand-500'} {className}"
		{...rest}
	/>
	{#if error}
		<p class="text-xs text-red-600">{error}</p>
	{:else if hint}
		<p class="text-xs text-gray-400">{hint}</p>
	{/if}
</div>
