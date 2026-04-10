<script lang="ts">
	import { signIn } from '@auth/sveltekit/client';
	import { Fingerprint, Mail } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { startAuthentication } from '@simplewebauthn/browser';
	import { PUBLIC_HAS_GOOGLE_AUTH, PUBLIC_HAS_EMAIL_AUTH } from '$env/static/public';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';

	let mode = $state<'login' | 'signup'>('login');
	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let error = $state('');
	let loading = $state(false);

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
				error =
					mode === 'login'
						? 'Invalid email or password.'
						: 'Could not create account. Email may already be in use.';
			} else {
				if (mode === 'signup') {
					localStorage.setItem('new_signup', '1');
				}
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

	function switchMode() {
		mode = mode === 'login' ? 'signup' : 'login';
		error = '';
	}
</script>

<div class="w-full max-w-sm space-y-5">
	<!-- Header -->
	<div class="text-center">
		<h1 class="text-2xl font-bold tracking-tight text-gray-900">
			{mode === 'login' ? 'Welcome back' : 'Create account'}
		</h1>
		<p class="mt-1 text-sm text-gray-500">
			{mode === 'login' ? 'Sign in to continue' : 'Get started for free'}
		</p>
	</div>

	<!-- Error -->
	{#if error}
		<Alert variant="error">{error}</Alert>
	{/if}

	{#if mode === 'login'}
		<!-- Passkey -->
		<Button variant="outline" class="w-full" onclick={handlePasskey} {loading}>
			<Fingerprint class="h-4 w-4" />
			Sign in with passkey
		</Button>

		<p class="text-center text-xs text-gray-400">
			Need to register a passkey first? Sign in with email/password, then add one from the app.
		</p>

		{#if PUBLIC_HAS_GOOGLE_AUTH === 'true'}
			<button
				type="button"
				onclick={handleGoogle}
				disabled={loading}
				class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
			>
				<svg class="h-4 w-4" viewBox="0 0 24 24" aria-label="Google">
					<path
						fill="#4285F4"
						d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
					/>
					<path
						fill="#34A853"
						d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
					/>
					<path
						fill="#FBBC05"
						d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
					/>
					<path
						fill="#EA4335"
						d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
					/>
				</svg>
				Continue with Google
			</button>
		{/if}

		<div class="relative">
			<div class="absolute inset-0 flex items-center">
				<span class="w-full border-t border-gray-200"></span>
			</div>
			<div class="relative flex justify-center text-xs uppercase">
				<span class="bg-white px-2 text-gray-400">or continue with email</span>
			</div>
		</div>
	{/if}

	<!-- Email + Password form -->
	<form onsubmit={handleCredentials} class="space-y-4">
		{#if mode === 'signup'}
			<Input id="name" label="Name" type="text" bind:value={name} required autocomplete="name" />
		{/if}

		<Input
			id="email"
			label="Email"
			type="email"
			bind:value={email}
			required
			autocomplete="email"
			placeholder="you@example.com"
		/>

		<Input
			id="password"
			label="Password"
			type="password"
			bind:value={password}
			required
			autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
		/>

		{#if mode === 'signup'}
			<Input
				id="confirmPassword"
				label="Confirm password"
				type="password"
				bind:value={confirmPassword}
				required
				autocomplete="new-password"
				hint="Min 8 characters · uppercase · lowercase · number"
			/>
		{/if}

		<Button type="submit" class="w-full" {loading}>
			{mode === 'login' ? 'Sign in' : 'Create account'}
		</Button>
	</form>

	<p class="text-center text-sm text-gray-500">
		{mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
		<button type="button" onclick={switchMode} class="cursor-pointer font-medium text-brand-600 hover:underline">
			{mode === 'login' ? 'Sign up' : 'Sign in'}
		</button>
	</p>

	{#if mode === 'login' && PUBLIC_HAS_EMAIL_AUTH === 'true'}
		<div class="relative">
			<div class="absolute inset-0 flex items-center">
				<span class="w-full border-t border-gray-200"></span>
			</div>
			<div class="relative flex justify-center text-xs uppercase">
				<span class="bg-white px-2 text-gray-400">or magic link</span>
			</div>
		</div>
		<form onsubmit={handleMagicLink} class="space-y-3">
			<Input
				type="email"
				bind:value={email}
				placeholder="your@email.com"
				required
				aria-label="Email for magic link"
			/>
			<Button variant="outline" type="submit" class="w-full" {loading}>
				<Mail class="h-4 w-4" />
				Send magic link
			</Button>
		</form>
	{/if}
</div>
