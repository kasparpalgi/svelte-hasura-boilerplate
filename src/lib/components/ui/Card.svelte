<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		hover?: boolean;
		children: Snippet;
	}

	let { class: className = '', hover = false, children }: Props = $props();
</script>

<div
	class="rounded-xl border border-gray-200 bg-white shadow-card {hover
		? 'transition-shadow duration-200 hover:shadow-popover hover:-translate-y-0.5 transition-transform'
		: ''} {className}"
>
	{@render children()}
</div>
