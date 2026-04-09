<script lang="ts">
	import { signOut } from '@auth/sveltekit/client';
	import { Layers, Settings, LogOut, ChevronDown } from '@lucide/svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	const user = $derived(data.session?.user);

	const initials = $derived.by(() => {
		const src = user?.name ?? user?.email ?? '';
		return src
			.split(/[\s@]+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((s) => s[0].toUpperCase())
			.join('');
	});

	let menuOpen = $state(false);

	function dismissOnClickOutside(node: HTMLElement) {
		function onDocClick(e: MouseEvent) {
			if (!node.contains(e.target as Node)) menuOpen = false;
		}
		document.addEventListener('click', onDocClick, true);
		return () => document.removeEventListener('click', onDocClick, true);
	}
</script>

<div class="min-h-screen bg-gray-50">
	<header class="border-b border-gray-200 bg-white shadow-sm">
		<div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
			<a
				href="/app"
				class="flex cursor-pointer items-center gap-2 font-semibold text-gray-900 transition-colors hover:text-brand-600"
			>
				<Layers class="h-5 w-5 text-brand-600" />
				My App
			</a>

			<div class="flex items-center gap-2">
				<!-- User avatar -->
				{#if initials}
					<div
						class="hidden h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 sm:flex"
						title={user?.name ?? user?.email}
					>
						{initials}
					</div>
				{/if}

				{#if user?.name || user?.email}
					<span class="hidden rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 sm:inline">
						{user.name ?? user.email}
					</span>
				{/if}

				<div class="relative" {@attach dismissOnClickOutside}>
					<button
						type="button"
						onclick={() => (menuOpen = !menuOpen)}
						aria-expanded={menuOpen}
						aria-haspopup="menu"
						class="flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:border-brand-300 hover:bg-gray-50 hover:text-brand-600"
					>
						<Settings class="h-3.5 w-3.5" />
						<ChevronDown
							class="h-3 w-3 transition-transform duration-150 {menuOpen ? 'rotate-180' : ''}"
						/>
					</button>

					{#if menuOpen}
						<div
							role="menu"
							class="animate-in fade-in slide-in-from-top-1 duration-150 absolute right-0 top-full z-20 mt-1.5 w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-popover"
						>
							<a
								href="/app/settings"
								role="menuitem"
								onclick={() => (menuOpen = false)}
								class="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-brand-600"
							>
								<Settings class="h-4 w-4 text-gray-400" />
								Settings
							</a>
							<hr class="my-1 border-gray-100" />
							<button
								type="button"
								role="menuitem"
								onclick={() => {
									menuOpen = false;
									signOut({ redirectTo: '/signin' });
								}}
								class="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-red-50 hover:text-red-600"
							>
								<LogOut class="h-4 w-4 text-gray-400" />
								Sign out
							</button>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-5xl px-4 py-8">
		{@render children()}
	</main>
</div>
