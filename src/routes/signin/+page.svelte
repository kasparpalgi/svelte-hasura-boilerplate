<script lang="ts">
	import LoginForm from '$lib/components/auth/LoginForm.svelte';
</script>

<svelte:head><title>Sign In</title></svelte:head>

<div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4">
	<!-- Brand gradient orbs -->
	<div
		class="pointer-events-none absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-brand-100/70 blur-3xl"
	></div>
	<div
		class="pointer-events-none absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-violet-100/50 blur-3xl"
	></div>

	<!-- Form card -->
	<div
		class="animate-in fade-in slide-in-from-bottom-6 fill-mode-backwards duration-500 relative w-full max-w-sm rounded-2xl border border-gray-200 bg-white/90 p-8 shadow-popover backdrop-blur-sm"
	>
		<LoginForm />
	</div>
</div>
