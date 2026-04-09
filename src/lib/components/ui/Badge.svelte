<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'default' | 'success' | 'warning' | 'destructive' | 'outline';
		size?: 'sm' | 'md';
		class?: string;
		children: Snippet;
	}

	let { variant = 'default', size = 'md', class: className = '', children }: Props = $props();

	const variants: Record<string, string> = {
		default:     'bg-brand-50 text-brand-700 ring-brand-200/60',
		success:     'bg-success-50 text-success-600 ring-green-200/60',
		warning:     'bg-warning-50 text-warning-600 ring-yellow-200/60',
		destructive: 'bg-red-50 text-red-600 ring-red-200/60',
		outline:     'bg-white text-gray-600 ring-gray-200',
	};

	const sizes: Record<string, string> = {
		sm: 'px-2 py-0.5 text-[11px]',
		md: 'px-2.5 py-0.5 text-xs',
	};
</script>

<span
	class="inline-flex items-center gap-1 rounded-full font-medium ring-1 ring-inset {variants[variant]} {sizes[size]} {className}"
>
	{@render children()}
</span>
