<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { Loader2 } from '@lucide/svelte';

	interface Props extends HTMLButtonAttributes {
		variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive';
		size?: 'sm' | 'md' | 'lg';
		loading?: boolean;
		children: Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		loading = false,
		disabled,
		class: className = '',
		children,
		...rest
	}: Props = $props();

	const base =
		'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none';

	const variants: Record<string, string> = {
		primary:
			'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:scale-[0.98] focus-visible:ring-brand-500 btn-glow',
		secondary:
			'bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-200 focus-visible:ring-brand-500',
		ghost:
			'text-gray-600 hover:bg-gray-100 active:bg-gray-200 focus-visible:ring-gray-400',
		outline:
			'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 focus-visible:ring-gray-400',
		destructive:
			'bg-red-600 text-white shadow-sm hover:bg-red-700 active:scale-[0.98] focus-visible:ring-red-500',
	};

	const sizes: Record<string, string> = {
		sm: 'h-8 px-3 text-xs',
		md: 'h-9 px-4 text-sm',
		lg: 'h-11 px-6 text-base',
	};
</script>

<button
	class="{base} {variants[variant]} {sizes[size]} {className}"
	disabled={disabled || loading}
	{...rest}
>
	{#if loading}
		<Loader2 class="h-4 w-4 animate-spin" />
	{/if}
	{@render children()}
</button>
