<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { startRegistration } from '@simplewebauthn/browser';
	import { User, Lock, Fingerprint, CheckCircle, AlertCircle, Smartphone, Shield, Trash2, ChevronDown } from '@lucide/svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const user = $derived(data.session?.user);
	const emailChangeStatus = $derived($page.url.searchParams.get('email_change'));
	const lastAction = $derived(form?.success ? (form as { action?: string }).action : null);

	let nameLoading = $state(false);
	let passwordLoading = $state(false);
	let emailLoading = $state(false);
	let passkeyStatus = $state<'idle' | 'loading' | 'error'>('idle');
	let deletingId = $state<string | null>(null);
	let emailFormOpen = $state(false);

	async function addPasskey() {
		passkeyStatus = 'loading';
		try {
			const optionsRes = await fetch('/auth/webauthn-options/passkey?action=register');
			if (!optionsRes.ok) throw new Error('Could not get registration options');
			const { options } = await optionsRes.json();
			const credential = await startRegistration(options);
			const f = document.createElement('form');
			f.method = 'POST';
			f.action = '/auth/callback/passkey';
			for (const [n, v] of Object.entries({ action: 'register', data: JSON.stringify(credential), redirectTo: '/app/settings' })) {
				const input = document.createElement('input');
				input.type = 'hidden';
				input.name = n;
				input.value = v;
				f.appendChild(input);
			}
			document.body.appendChild(f);
			f.submit();
		} catch (err) {
			if (err instanceof Error && err.name !== 'NotAllowedError') {
				passkeyStatus = 'error';
				setTimeout(() => (passkeyStatus = 'idle'), 3000);
			} else {
				passkeyStatus = 'idle';
			}
		}
	}

	function deviceLabel(deviceType: string, backedUp: boolean): string {
		if (deviceType === 'multiDevice') return backedUp ? 'Synced passkey' : 'Multi-device passkey';
		return 'Hardware key';
	}
</script>

<svelte:head><title>Settings</title></svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-gray-900">Account settings</h1>
		<p class="mt-1 text-sm text-gray-500">Manage your profile, security, and sign-in methods.</p>
	</div>

	<!-- Email confirmation banner -->
	{#if emailChangeStatus}
		<div class="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm {emailChangeStatus === 'success' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}">
			{#if emailChangeStatus === 'success'}
				<CheckCircle class="h-4 w-4 shrink-0" />
				Email address updated successfully.
			{:else if emailChangeStatus === 'expired'}
				<AlertCircle class="h-4 w-4 shrink-0" />
				That confirmation link has expired. Please request a new one.
			{:else if emailChangeStatus === 'taken'}
				<AlertCircle class="h-4 w-4 shrink-0" />
				That email address is already in use by another account.
			{:else}
				<AlertCircle class="h-4 w-4 shrink-0" />
				Invalid confirmation link.
			{/if}
		</div>
	{/if}

	<!-- Profile -->
	<Card>
		<div class="divide-y divide-gray-100">
			<!-- Name -->
			<div class="p-6">
				<div class="mb-5 flex items-center gap-2">
					<div class="rounded-lg bg-brand-50 p-2 text-brand-600"><User class="h-4 w-4" /></div>
					<h2 class="font-semibold text-gray-900">Profile</h2>
				</div>
				<form
					method="POST"
					action="?/updateName"
					use:enhance={() => {
						nameLoading = true;
						return async ({ update }) => { nameLoading = false; update(); };
					}}
					class="space-y-4"
				>
					<div>
						<label for="name" class="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1.5">
							Display name
						</label>
						<input
							id="name"
							name="name"
							type="text"
							value={user?.name ?? ''}
							maxlength="100"
							required
							class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
						/>
						{#if form && !form.success && (form as { field?: string }).field === 'name'}
							<p class="mt-1 text-xs text-red-600">{(form as { error?: string }).error}</p>
						{/if}
					</div>
					<div class="flex items-center gap-3">
						<Button type="submit" size="sm" loading={nameLoading}>Save name</Button>
						{#if lastAction === 'updateName'}
							<span class="flex items-center gap-1 text-xs text-green-600">
								<CheckCircle class="h-3.5 w-3.5" /> Saved
							</span>
						{/if}
					</div>
				</form>
			</div>

			<!-- Email -->
			<div class="p-6">
				<div class="flex items-center justify-between gap-3">
					<div>
						<p class="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">Email</p>
						<p class="text-sm text-gray-700">{user?.email ?? '—'}</p>
					</div>
					<button
						type="button"
						onclick={() => (emailFormOpen = !emailFormOpen)}
						class="flex shrink-0 cursor-pointer items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
					>
						Change
						<ChevronDown class="h-3 w-3 transition-transform duration-200 {emailFormOpen ? 'rotate-180' : ''}" />
					</button>
				</div>

				{#if emailFormOpen}
					<form
						method="POST"
						action="?/requestEmailChange"
						use:enhance={() => {
							emailLoading = true;
							return async ({ result, update }) => {
								emailLoading = false;
								if (result.type === 'success') emailFormOpen = false;
								update();
							};
						}}
						class="mt-4 space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-4"
					>
						<div>
							<label for="newEmail" class="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1.5">
								New email address
							</label>
							<input
								id="newEmail"
								name="newEmail"
								type="email"
								placeholder="new@example.com"
								required
								class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
							/>
							{#if form && !form.success && (form as { field?: string }).field === 'email'}
								<p class="mt-1 text-xs text-red-600">{(form as { error?: string }).error}</p>
							{/if}
						</div>
						<div class="flex items-center gap-3">
							<Button type="submit" size="sm" loading={emailLoading}>Send confirmation</Button>
							<button
								type="button"
								onclick={() => (emailFormOpen = false)}
								class="cursor-pointer text-xs text-gray-400 hover:text-gray-600"
							>
								Cancel
							</button>
						</div>
						<p class="text-xs text-gray-400">A confirmation link will be sent to your new address.</p>
					</form>
				{/if}

				{#if lastAction === 'requestEmailChange'}
					<p class="mt-3 flex items-center gap-1 text-xs text-green-600">
						<CheckCircle class="h-3.5 w-3.5" /> Check your new inbox for a confirmation link.
					</p>
				{/if}
			</div>
		</div>
	</Card>

	<!-- Password -->
	<Card>
		<div class="p-6">
			<div class="mb-5 flex items-center gap-2">
				<div class="rounded-lg bg-brand-50 p-2 text-brand-600"><Lock class="h-4 w-4" /></div>
				<h2 class="font-semibold text-gray-900">Password</h2>
			</div>

			<form
				method="POST"
				action="?/changePassword"
				use:enhance={() => {
					passwordLoading = true;
					return async ({ update }) => { passwordLoading = false; update({ reset: true }); };
				}}
				class="space-y-4"
			>
				<div>
					<label for="currentPassword" class="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1.5">
						Current password
					</label>
					<input
						id="currentPassword"
						name="currentPassword"
						type="password"
						autocomplete="current-password"
						required
						class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
					/>
					{#if form && !form.success && (form as { field?: string }).field === 'currentPassword'}
						<p class="mt-1 text-xs text-red-600">{(form as { error?: string }).error}</p>
					{/if}
				</div>

				<div>
					<label for="newPassword" class="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1.5">
						New password
					</label>
					<input
						id="newPassword"
						name="newPassword"
						type="password"
						autocomplete="new-password"
						required
						class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
					/>
					{#if form && !form.success && (form as { field?: string }).field === 'newPassword'}
						<p class="mt-1 text-xs text-red-600">{(form as { error?: string }).error}</p>
					{/if}
					<p class="mt-1 text-xs text-gray-400">Min 8 chars · uppercase · lowercase · number</p>
				</div>

				<div>
					<label for="confirmPassword" class="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1.5">
						Confirm new password
					</label>
					<input
						id="confirmPassword"
						name="confirmPassword"
						type="password"
						autocomplete="new-password"
						required
						class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
					/>
					{#if form && !form.success && (form as { field?: string }).field === 'confirmPassword'}
						<p class="mt-1 text-xs text-red-600">{(form as { error?: string }).error}</p>
					{/if}
				</div>

				<div class="flex items-center gap-3">
					<Button type="submit" size="sm" loading={passwordLoading}>Change password</Button>
					{#if lastAction === 'changePassword'}
						<span class="flex items-center gap-1 text-xs text-green-600">
							<CheckCircle class="h-3.5 w-3.5" /> Password updated
						</span>
					{/if}
				</div>
			</form>
		</div>
	</Card>

	<!-- Passkeys -->
	<Card>
		<div class="p-6">
			<div class="mb-4 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<div class="rounded-lg bg-brand-50 p-2 text-brand-600"><Fingerprint class="h-4 w-4" /></div>
					<h2 class="font-semibold text-gray-900">Passkeys</h2>
				</div>
				<Button variant="secondary" size="sm" loading={passkeyStatus === 'loading'} onclick={addPasskey}>
					<Fingerprint class="h-3.5 w-3.5" />
					{passkeyStatus === 'error' ? 'Failed — try again' : 'Add passkey'}
				</Button>
			</div>

			<p class="mb-4 text-sm text-gray-500">
				Sign in with Face ID, Touch ID, or a hardware key — no password needed.
			</p>

			{#if data.passkeys.length === 0}
				<div class="flex items-center gap-3 rounded-lg border border-dashed border-gray-200 p-4 text-sm text-gray-400">
					<Shield class="h-4 w-4 shrink-0" />
					No passkeys yet. Add one above for faster, passwordless sign-in.
				</div>
			{:else}
				<ul class="space-y-2">
					{#each data.passkeys as pk (pk.credentialID)}
						<li class="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
							<Smartphone class="h-4 w-4 shrink-0 text-gray-400" />
							<div class="min-w-0 flex-1">
								<p class="text-sm font-medium text-gray-700">{deviceLabel(pk.credentialDeviceType, pk.credentialBackedUp)}</p>
								<p class="truncate font-mono text-xs text-gray-400">{pk.credentialID.slice(0, 24)}…</p>
							</div>
							{#if pk.credentialBackedUp}
								<Badge variant="success">Synced</Badge>
							{/if}
							<form
								method="POST"
								action="?/deletePasskey"
								use:enhance={() => {
									deletingId = pk.credentialID;
									return async ({ update }) => { deletingId = null; update(); };
								}}
							>
								<input type="hidden" name="credentialID" value={pk.credentialID} />
								<button
									type="submit"
									title="Remove passkey"
									disabled={deletingId === pk.credentialID}
									class="cursor-pointer rounded-md p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
								>
									<Trash2 class="h-3.5 w-3.5" />
								</button>
							</form>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</Card>
</div>
