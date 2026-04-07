<script lang="ts">
	import { signOut } from '@auth/sveltekit/client';
	import { startRegistration } from '@simplewebauthn/browser';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	const user = $derived(data.session?.user);

	let passkeyStatus = $state<'idle' | 'loading' | 'done' | 'error'>('idle');

	async function addPasskey() {
		passkeyStatus = 'loading';
		try {
			const optionsRes = await fetch('/auth/webauthn-options/passkey?action=register');
			if (!optionsRes.ok) throw new Error('Could not get registration options');
			const { options } = await optionsRes.json();

			const credential = await startRegistration(options);

			const form = document.createElement('form');
			form.method = 'POST';
			form.action = '/auth/callback/passkey';
			for (const [n, v] of Object.entries({
				action: 'register',
				data: JSON.stringify(credential),
				redirectTo: '/app'
			})) {
				const input = document.createElement('input');
				input.type = 'hidden';
				input.name = n;
				input.value = v;
				form.appendChild(input);
			}
			document.body.appendChild(form);
			form.submit();
		} catch (err) {
			if (err instanceof Error && err.name !== 'NotAllowedError') {
				passkeyStatus = 'error';
				setTimeout(() => (passkeyStatus = 'idle'), 3000);
			} else {
				passkeyStatus = 'idle';
			}
		}
	}
</script>

<div class="min-h-screen bg-gray-50">
	<header class="border-b border-gray-200 bg-white">
		<div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
			<span class="font-semibold text-gray-800">My App</span>
			<div class="flex items-center gap-3">
				{#if user?.name || user?.email}
					<span class="hidden text-sm text-gray-500 sm:inline">{user.name ?? user.email}</span>
				{/if}

				<!-- Add Passkey: register biometrics for this device after signing in -->
				<button
					type="button"
					onclick={addPasskey}
					disabled={passkeyStatus === 'loading'}
					title="Add this device's fingerprint / Face ID / Windows Hello as a sign-in method"
					class="flex items-center gap-1.5 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
				>
					<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M7.864 4.243A7.5 7.5 0 0 1 19.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 0 0 4.5 10.5a7.464 7.464 0 0 1-1.15 3.993m1.989 3.559A11.209 11.209 0 0 0 8.25 10.5a3.75 3.75 0 1 1 7.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 0 1-3.6 9.75m6.633-4.596a18.666 18.666 0 0 1-2.485 5.33" />
					</svg>
					{#if passkeyStatus === 'loading'}
						Adding…
					{:else if passkeyStatus === 'error'}
						Failed
					{:else}
						Add passkey
					{/if}
				</button>

				<button
					type="button"
					onclick={() => signOut({ redirectTo: '/signin' })}
					class="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
				>
					Sign out
				</button>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-5xl px-4 py-8">
		{@render children()}
	</main>
</div>
