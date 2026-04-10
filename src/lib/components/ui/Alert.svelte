<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Info, CheckCircle, AlertTriangle, XCircle } from '@lucide/svelte';

	interface Props {
		variant?: 'info' | 'success' | 'warning' | 'error';
		title?: string;
		class?: string;
		children: Snippet;
	}

	let { variant = 'info', title, class: className = '', children }: Props = $props();

	const variants = {
		info: {
			Icon: Info,
			wrap: 'border-info-200 bg-info-50 text-info-800',
			iconCls: 'text-info-500',
		},
		success: {
			Icon: CheckCircle,
			wrap: 'border-success-200 bg-success-50 text-success-800',
			iconCls: 'text-success-600',
		},
		warning: {
			Icon: AlertTriangle,
			wrap: 'border-warning-200 bg-warning-50 text-warning-800',
			iconCls: 'text-warning-600',
		},
		error: {
			Icon: XCircle,
			wrap: 'border-error-200 bg-error-50 text-error-800',
			iconCls: 'text-error-600',
		},
	} as const;

	const { Icon, wrap, iconCls } = $derived(variants[variant]);
</script>

<div
	class="animate-in fade-in slide-in-from-top-1 fill-mode-backwards duration-200 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm {wrap} {className}"
	role="alert"
>
	<Icon class="mt-0.5 h-4 w-4 shrink-0 {iconCls}" />
	<div class="min-w-0 flex-1">
		{#if title}
			<p class="font-semibold">{title}</p>
		{/if}
		<div class={title ? 'mt-0.5 opacity-90' : ''}>
			{@render children()}
		</div>
	</div>
</div>
