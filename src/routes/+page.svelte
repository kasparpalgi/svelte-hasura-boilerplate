<script lang="ts">
	import { Fingerprint, Zap, ShieldCheck, ArrowRight, Layers } from '@lucide/svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const features = [
		{
			icon: Fingerprint,
			color: 'bg-brand-100 text-brand-600',
			title: 'Authentication',
			desc: 'Email/password, passkeys (Touch ID, Face ID, Windows Hello), Google OAuth and magic links — all wired up.',
		},
		{
			icon: Zap,
			color: 'bg-amber-100 text-amber-600',
			title: 'GraphQL API',
			desc: 'Hasura gives you an instant, real-time GraphQL API over Postgres with fine-grained row-level permissions.',
		},
		{
			icon: ShieldCheck,
			color: 'bg-green-100 text-green-600',
			title: 'Type safe',
			desc: 'Auto-generated TypeScript types from your GraphQL schema keep the frontend and backend in sync automatically.',
		},
	];

	const stack = ['SvelteKit', 'Hasura', 'Postgres', 'Auth.js', 'Tailwind', 'TypeScript'];
</script>

<svelte:head>
	<title>My App — Build something great</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-white">
	<!-- Nav -->
	<header class="sticky top-0 z-10 border-b border-gray-100 bg-white/80 backdrop-blur-md">
		<div class="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
			<span class="flex items-center gap-2 text-lg font-bold tracking-tight text-gray-900">
				<Layers class="h-5 w-5 text-brand-600" />
				My App
			</span>
			<div class="flex items-center gap-3">
				{#if data.session}
					<a
						href="/app"
						class="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 btn-glow"
					>
						Go to app <ArrowRight class="h-3.5 w-3.5" />
					</a>
				{:else}
					<a href="/signin" class="text-sm font-medium text-gray-600 hover:text-gray-900">Sign in</a>
					<a
						href="/signin"
						class="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 btn-glow"
					>
						Get started <ArrowRight class="h-3.5 w-3.5" />
					</a>
				{/if}
			</div>
		</div>
	</header>

	<!-- Hero -->
	<section class="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-28 text-center">
		<!-- Gradient orbs -->
		<div class="pointer-events-none absolute -top-48 -right-48 h-[600px] w-[600px] rounded-full bg-brand-100/60 blur-3xl"></div>
		<div class="pointer-events-none absolute -bottom-48 -left-48 h-[600px] w-[600px] rounded-full bg-violet-100/40 blur-3xl"></div>

		<Badge class="mb-5">Open source boilerplate</Badge>

		<h1 class="relative max-w-2xl text-5xl font-black leading-[1.1] tracking-tight text-gray-900 sm:text-6xl">
			Build your next idea<br />
			<span class="text-gradient">faster than ever</span>
		</h1>

		<p class="relative mt-6 max-w-xl text-lg leading-relaxed text-gray-500">
			A production-ready SvelteKit + Hasura boilerplate with authentication, GraphQL, and type
			safety — so you can ship features, not boilerplate.
		</p>

		<div class="relative mt-10 flex flex-wrap items-center justify-center gap-4">
			<a
				href="/signin"
				class="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-7 py-3.5 text-base font-semibold text-white shadow-md transition hover:bg-brand-700 active:scale-[0.98] btn-glow"
			>
				Create free account <ArrowRight class="h-4 w-4" />
			</a>
			<a
				href="/app"
				class="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-7 py-3.5 text-base font-semibold text-gray-700 transition hover:bg-gray-50"
			>
				Sign in
			</a>
		</div>

		<!-- Stack badges -->
		<div class="relative mt-12 flex flex-wrap justify-center gap-2">
			{#each stack as tech (tech)}
				<Badge variant="outline">{tech}</Badge>
			{/each}
		</div>
	</section>

	<!-- Features -->
	<section class="section-fade border-t border-gray-100 px-6 py-20">
		<div class="mx-auto max-w-5xl">
			<h2 class="mb-3 text-center text-sm font-semibold uppercase tracking-widest text-brand-600">
				What's included
			</h2>
			<h3 class="mb-12 text-center text-3xl font-bold text-gray-900">Everything you need to ship</h3>
			<div class="grid gap-6 sm:grid-cols-3">
				{#each features as { icon: Icon, color, title, desc } (title)}
					<div class="group rounded-xl border border-gray-200 bg-white p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-popover">
						<div class="mb-4 inline-flex rounded-lg p-2.5 {color}">
							<Icon class="h-5 w-5" />
						</div>
						<h4 class="mb-2 font-semibold text-gray-900">{title}</h4>
						<p class="text-sm leading-relaxed text-gray-500">{desc}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="border-t border-gray-100 px-6 py-6 text-center text-xs text-gray-400">
		My App © {new Date().getFullYear()}
	</footer>
</div>
