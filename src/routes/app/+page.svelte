<script lang="ts">
	import { LayoutDashboard, Zap, ShieldCheck } from '@lucide/svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const user = $derived(data.session?.user);

	const quickLinks = [
		{ icon: LayoutDashboard, label: 'Dashboard', href: '/app', desc: 'Your main workspace' },
		{ icon: Zap, label: 'GraphQL', href: 'http://localhost:9695', desc: 'Hasura console', external: true },
		{ icon: ShieldCheck, label: 'Settings', href: '/app/settings', desc: 'Account & preferences' },
	];
</script>

<svelte:head><title>App</title></svelte:head>

<div class="space-y-8">
	<!-- Welcome -->
	<Card class="overflow-hidden">
		<div class="relative p-6">
			<div class="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-50/80 to-violet-50/40 rounded-xl"></div>
			<div class="relative">
				<Badge class="mb-3">Logged in</Badge>
				<h1 class="text-2xl font-bold text-gray-900">
					Welcome{user?.name ? `, ${user.name}` : ''}!
				</h1>
				<p class="mt-1 text-gray-500">You're signed in and ready to build.</p>
			</div>
		</div>
	</Card>

	<!-- Quick links -->
	<div>
		<h2 class="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-400">Quick links</h2>
		<div class="grid gap-3 sm:grid-cols-3">
			{#each quickLinks as { icon: Icon, label, href, desc, external } (label)}
				<a
					{href}
					target={external ? '_blank' : undefined}
					rel={external ? 'noopener noreferrer' : undefined}
					class="group flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-popover"
				>
					<div class="mt-0.5 rounded-lg bg-brand-50 p-2 text-brand-600 group-hover:bg-brand-100 transition-colors">
						<Icon class="h-4 w-4" />
					</div>
					<div>
						<p class="text-sm font-medium text-gray-900">{label}</p>
						<p class="text-xs text-gray-400">{desc}</p>
					</div>
				</a>
			{/each}
		</div>
	</div>
</div>
