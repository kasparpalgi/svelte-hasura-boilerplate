<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>My App — Build something great</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-white">
	<!-- Nav -->
	<header class="border-b border-gray-100">
		<div class="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
			<span class="text-lg font-bold tracking-tight text-gray-900">My App</span>
			<div class="flex items-center gap-3">
				{#if data.session}
					<a href="/app" class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
						Go to app
					</a>
				{:else}
					<a href="/app" class="text-sm font-medium text-gray-600 hover:text-gray-900">Sign in</a>
					<a href="/signin" class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
						Get started
					</a>
				{/if}
			</div>
		</div>
	</header>

	<!-- Hero -->
	<section class="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
		<span class="mb-4 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
			Open source boilerplate
		</span>
		<h1 class="max-w-2xl text-5xl font-extrabold leading-tight tracking-tight text-gray-900">
			Build your next idea<br />
			<span class="text-blue-600">faster than ever</span>
		</h1>
		<p class="mt-6 max-w-xl text-lg text-gray-500">
			Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque vehicula ligula eu
			risus euismod, in commodo nunc luctus. Phasellus volutpat metus sed libero tristique,
			vel fermentum lorem efficitur.
		</p>
		<div class="mt-10 flex flex-wrap items-center justify-center gap-4">
			<a href="/signin"
				class="rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow hover:bg-blue-700">
				Create free account
			</a>
			<a href="/app"
				class="rounded-lg border border-gray-300 px-6 py-3 text-base font-semibold text-gray-700 hover:bg-gray-50">
				Sign in
			</a>
		</div>
	</section>

	<!-- Features -->
	<section class="border-t border-gray-100 bg-gray-50 px-6 py-20">
		<div class="mx-auto max-w-5xl">
			<h2 class="mb-12 text-center text-2xl font-bold text-gray-900">Everything you need</h2>
			<div class="grid gap-8 sm:grid-cols-3">
				{#each [
					{ title: 'Authentication', icon: '🔐', desc: 'Email/password, passkeys (Touch ID, Windows Hello), optional Google OAuth and magic links.' },
					{ title: 'GraphQL API', icon: '⚡', desc: 'Hasura gives you an instant, realtime GraphQL API over Postgres with fine-grained permissions.' },
					{ title: 'Type safe', icon: '🛡️', desc: 'Auto-generated TypeScript types from your GraphQL schema keep your frontend and backend in sync.' }
				] as feature}
					<div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
						<div class="mb-3 text-3xl">{feature.icon}</div>
						<h3 class="mb-1 font-semibold text-gray-900">{feature.title}</h3>
						<p class="text-sm text-gray-500">{feature.desc}</p>
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
