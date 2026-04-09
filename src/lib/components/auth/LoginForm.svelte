<script lang="ts">
	import { signIn } from '@auth/sveltekit/client';
	import { goto } from '$app/navigation';
	import { startAuthentication } from '@simplewebauthn/browser';
	import { PUBLIC_HAS_GOOGLE_AUTH, PUBLIC_HAS_EMAIL_AUTH } from '$env/static/public';

	let mode = $state<'login' | 'signup'>('login');
	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let error = $state('');
	let loading = $state(false);

	// Passkey sign-in only — authentication of an existing passkey on this device.
	// To add a passkey for the first time, sign in with email/password, then use
	// "Add Passkey" in the app header.
	async function handlePasskey() {
		loading = true;
		error = '';
		try {
			const optionsRes = await fetch('/auth/webauthn-options/passkey?action=authenticate');
			if (!optionsRes.ok) throw new Error('Could not get passkey options');
			const { options } = await optionsRes.json();

			const credential = await startAuthentication(options);

			const form = document.createElement('form');
			form.method = 'POST';
			form.action = '/auth/callback/passkey';
			for (const [n, v] of Object.entries({
				action: 'authenticate',
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
				error = 'No passkey found on this device. Sign in with email/password first.';
			}
			loading = false;
		}
	}

	async function handleCredentials(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		if (mode === 'signup' && password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}
		loading = true;
		try {
			const result = await signIn('credentials', { email, password, mode, name, redirect: false });
			if (result?.error) {
				error = mode === 'login' ? 'Invalid email or password.' : 'Could not create account. Email may already be in use.';
			} else {
				await goto('/app');
			}
		} catch {
			error = 'Something went wrong. Please try again.';
		} finally {
			loading = false;
		}
	}

	async function handleGoogle() {
		loading = true;
		await signIn('google', { redirectTo: '/app' });
	}

	async function handleMagicLink(e: SubmitEvent) {
		e.preventDefault();
		loading = true;
		try {
			await signIn('nodemailer', { email, redirectTo: '/app' });
		} catch {
			error = 'Failed to send magic link.';
		} finally {
			loading = false;
		}
	}
</script>

<div class="w-full max-w-sm space-y-5">
	<div class="text-center">
		<h1 class="text-2xl font-bold text-gray-900">{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
		<p class="mt-1 text-sm text-gray-500">
			{mode === 'login' ? 'Sign in to continue' : 'Get started for free'}
		</p>
	</div>

	{#if error}
		<p class="rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
	{/if}

	{#if mode === 'login'}
	<!-- Passkey: sign in with biometrics if already registered on this device -->
	<button
		type="button"
		onclick={handlePasskey}
		disabled={loading}
		class="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
	>
		<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
			<path stroke-linecap="round" stroke-linejoin="round" d="M7.864 4.243A7.5 7.5 0 0 1 19.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 0 0 4.5 10.5a7.464 7.464 0 0 1-1.15 3.993m1.989 3.559A11.209 11.209 0 0 0 8.25 10.5a3.75 3.75 0 1 1 7.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 0 1-3.6 9.75m6.633-4.596a18.666 18.666 0 0 1-2.485 5.33" />
		</svg>
		Sign in with passkey
	</button>

	{#if PUBLIC_HAS_GOOGLE_AUTH === 'true'}
		<button
			type="button"
			onclick={handleGoogle}
			disabled={loading}
			class="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
		>
			<svg class="h-4 w-4" viewBox="0 0 24 24">
				<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
				<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
				<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
				<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
			</svg>
			Continue with Google
		</button>
	{/if}
	{/if}

	{#if mode === 'login'}
	<div class="relative">
		<div class="absolute inset-0 flex items-center"><span class="w-full border-t border-gray-200"></span></div>
		<div class="relative flex justify-center text-xs uppercase">
			<span class="bg-white px-2 text-gray-400">or</span>
		</div>
	</div>
	{/if}

	<!-- Email + Password -->
	<form onsubmit={handleCredentials} class="space-y-3">
		{#if mode === 'signup'}
			<div>
				<label for="name" class="block text-sm font-medium text-gray-700">Name</label>
				<input id="name" type="text" bind:value={name} required
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
			</div>
		{/if}

		<div>
			<label for="email" class="block text-sm font-medium text-gray-700">Email</label>
			<input id="email" type="email" bind:value={email} required autocomplete="email"
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
		</div>

		<div>
			<label for="password" class="block text-sm font-medium text-gray-700">Password</label>
			<input id="password" type="password" bind:value={password} required autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
		</div>

		{#if mode === 'signup'}
			<div>
				<label for="confirmPassword" class="block text-sm font-medium text-gray-700">Confirm password</label>
				<input id="confirmPassword" type="password" bind:value={confirmPassword} required autocomplete="new-password"
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
			</div>
			<p class="text-xs text-gray-500">Min 8 characters, one uppercase, one lowercase, one number.</p>
		{/if}

		<button type="submit" disabled={loading}
			class="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
			{loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
		</button>
	</form>

	<p class="text-center text-sm text-gray-500">
		{mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
		<button type="button"
			onclick={() => { mode = mode === 'login' ? 'signup' : 'login'; error = ''; }}
			class="font-medium text-blue-600 hover:underline">
			{mode === 'login' ? 'Sign up' : 'Sign in'}
		</button>
	</p>

	{#if mode === 'login'}
		<p class="text-center text-xs text-gray-400">
			Passkey not working? You need to <span class="font-medium">sign in with email/password first</span>,
			then add a passkey from the app.
		</p>
	{/if}

	{#if mode === 'login' && PUBLIC_HAS_EMAIL_AUTH === 'true'}
		<div class="relative">
			<div class="absolute inset-0 flex items-center"><span class="w-full border-t border-gray-200"></span></div>
			<div class="relative flex justify-center text-xs uppercase">
				<span class="bg-white px-2 text-gray-400">or magic link</span>
			</div>
		</div>
		<form onsubmit={handleMagicLink} class="space-y-3">
			<input type="email" bind:value={email} placeholder="your@email.com" required
				class="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
			<button type="submit" disabled={loading}
				class="w-full rounded-md border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50">
				Send magic link
			</button>
		</form>
	{/if}
</div>
