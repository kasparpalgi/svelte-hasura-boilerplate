<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { startRegistration } from '@simplewebauthn/browser';
	import { User, Lock, Fingerprint, CheckCircle, Smartphone, Shield, Trash2, ChevronDown } from '@lucide/svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
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

	function fieldError(field: string): string | undefined {
		if (form && !form.success && (form as { field?: string }).field === field) {
			return (form as { error?: string }).error;
		}
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
		{#if emailChangeStatus === 'success'}
			<Alert variant="success">Email address updated successfully.</Alert>
		{:else if emailChangeStatus === 'expired'}
			<Alert variant="warning">That confirmation link has expired. Please request a new one.</Alert>
		{:else if emailChangeStatus === 'taken'}
			<Alert variant="error">That email address is already in use by another account.</Alert>
		{:else}
			<Alert variant="error">Invalid confirmation link.</Alert>
		{/if}
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
					<Input
						id="name"
						name="name"
						type="text"
						value={user?.name ?? ''}
						maxlength={100}
						required
						label="Display name"
						error={fieldError('name')}
					/>
					<div class="flex items-center gap-3">
						<Button type="submit" size="sm" loading={nameLoading}>Save name</Button>
						{#if lastAction === 'updateName'}
							<span class="flex items-center gap-1 text-xs text-success-700">
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
						<p class="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-500">Email</p>
						<p class="text-sm text-gray-700">{user?.email ?? '—'}</p>
					</div>
					<button
						type="button"
						onclick={() => (emailFormOpen = !emailFormOpen)}
						class="flex shrink-0 cursor-pointer items-center gap-1 text-xs font-medium text-brand-600 transition-colors hover:text-brand-700"
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
						<Input
							id="newEmail"
							name="newEmail"
							type="email"
							placeholder="new@example.com"
							required
							label="New email address"
							error={fieldError('email')}
						/>
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
					<p class="mt-3 flex items-center gap-1 text-xs text-success-700">
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
				<Input
					id="currentPassword"
					name="currentPassword"
					type="password"
					autocomplete="current-password"
					required
					label="Current password"
					error={fieldError('currentPassword')}
				/>
				<Input
					id="newPassword"
					name="newPassword"
					type="password"
					autocomplete="new-password"
					required
					label="New password"
					hint="Min 8 chars · uppercase · lowercase · number"
					error={fieldError('newPassword')}
				/>
				<Input
					id="confirmPassword"
					name="confirmPassword"
					type="password"
					autocomplete="new-password"
					required
					label="Confirm new password"
					error={fieldError('confirmPassword')}
				/>
				<div class="flex items-center gap-3">
					<Button type="submit" size="sm" loading={passwordLoading}>Change password</Button>
					{#if lastAction === 'changePassword'}
						<span class="flex items-center gap-1 text-xs text-success-700">
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
									class="cursor-pointer rounded-md p-1.5 text-gray-400 transition hover:bg-error-50 hover:text-error-600 disabled:opacity-40"
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
